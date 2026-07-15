import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import Collective from "../models/collective.model.js";
import generateId from "../services/idGenerator.service.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await User.findOne({ username: email }).select("+password");
        if (user) {
          if (user.role == req.query.state) {
            await User.findByIdAndUpdate(
              { _id: user._id },
              { $set: { lastLogin: Date.now() } },
            );
            return done(null, user);
          } else {
            throw new Error("You are already registered as a different role");
          }
        }

        const [existingFG, existingCol] = await Promise.all([
          FarmerGroup.findOne({ email }, "_id"),
          Collective.findOne({ email }, "_id"),
        ]);
        const existingProfile = existingFG || existingCol;
        if (existingProfile) {
          user = await User.findById(existingProfile._id).select("+password");
          if (user) {
            if (user.role == req.query.state) {
              await User.findByIdAndUpdate(
                { _id: user._id },
                { $set: { lastLogin: Date.now() } },
              );
              return done(null, user);
            } else {
              throw new Error("You are already registered as a different role");
            }
          }
        }

        const role = ["FARMER_GROUP", "COLLECTIVE"].includes(req.query.state)
          ? req.query.state
          : "FARMER_GROUP";

        const rolePrefix =
          role === "FARMER_GROUP" ? "farmergroup" : "collective";

        const session = await mongoose.startSession();
        let newUser;

        await session.withTransaction(async () => {
          const uid = await generateId(rolePrefix, session);

          newUser = new User({
            uid,
            username: email,
            password: "OAUTH_USER",
            role,
            provider: "GOOGLE",
            isActive: true,
            lastLogin: Date.now(),
          });

          await newUser.save({ session });

          if (role === "FARMER_GROUP") {
            const farmerGroup = new FarmerGroup({
              _id: newUser._id,
              name: `Group ${uid}`,
              email,
              profile: profile.photos[0]?.value || "",
              farmerCount: 1,
              leadFarmer: name,
            });
            await farmerGroup.save({ session });
          } else {
            const collective = new Collective({
              _id: newUser._id,
              name: `Collective ${uid}`,
              email,
              profile: profile.photos[0]?.value || "",
              manager: name,
            });
            await collective.save({ session });
          }
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
