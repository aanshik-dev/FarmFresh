import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import generateId from "../services/idGenerator.service.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "dummy_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy_secret",
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Check if user exists
        let user = await User.findOne({ username: email }).select("+password");

        if (user) {
          return done(null, user);
        }

        // If user doesn't exist, create a new one as FARMER_GROUP
        const session = await mongoose.startSession();
        let newUser;

        await session.withTransaction(async () => {
          const uid = await generateId("farmergroup", session);

          newUser = new User({
            uid,
            username: email,
            password: "OAUTH_USER", // dummy password since they use Google
            role: "FARMER_GROUP",
            isActive: true,
            lastLogin: Date.now(),
          });

          await newUser.save({ session });

          // Generate dummy unique phone for the schema requirement
          const dummyPhone = `999${Math.floor(1000000 + Math.random() * 9000000)}`;

          const farmerGroup = new FarmerGroup({
            _id: newUser._id,
            name: name,
            email: email,
            phone: dummyPhone,
            profile: profile.photos[0]?.value || "",
            farmerCount: 1,
            leadFarmer: name,
            address: {
              village: "Unknown",
              area: "Unknown",
              city: "Unknown",
              state: "Unknown",
              pinCode: "000000",
              location: {
                type: "Point",
                coordinates: [0, 0], // default long, lat
              },
            },
          });

          await farmerGroup.save({ session });
        });

        await session.endSession();
        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

export default passport;
