import authService from "../services/authService.js";

const getOtp = async (req, res) => {
  try {
    await authService.sendOtp(req.body);
    res.status(201).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("GET_OTP Error", err);
    res.status(err.statusCode || 500).json({
      message: err.message,
    });
  }
};

const registerUser = async (req, res) => {
  try {
    await authService.registerUser(req.body);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      message: err.message,
    });
  }
};

// const register = async (req, res) => {
//   try {

//     const { username, password, role } = req.body;
//     const hashedPass = await bcrypt.hash(password, 10);

//     const newUser = new User({ username, password: hashedPass, role });
//     await newUser.save();
//     res
//       .status(201)
//       .json({ message: `User registered with username ${username}` })
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: `Something went wrong !!` })
//   }
// };

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json(`User with ${username} not found !!`);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(404).json({ message: `Invalid Credentials !!` });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: `Something went wrong !!` });
  }
};

export { getOtp, registerUser };
