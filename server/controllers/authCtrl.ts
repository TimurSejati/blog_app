import { Request, Response } from "express";
import Users from "../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  generateActiveToken,
  generateAccessToken,
  generateRefreshToken,
} from "../config/generateToken";
import sendEmail from "../config/sendMail";
import { validateEmail, validPhone } from "../middleware/valid";
import { sendSms } from "../config/sendSMS";
import { IDecodedToken, IUser } from "../config/interface";

const CLIENT_URL = `${process.env.BASE_URL}`;

const authCtrl = {
  register: async (req: Request, res: Response) => {
    try {
      const { name, account, password } = req.body;

      const user = await Users.findOne({ account });
      if (user)
        return res.status(400).json({ msg: "Email or Phone number already" });

      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = {
        name,
        account,
        password: passwordHash,
      };

      const active_token = generateActiveToken({ newUser });
      console.log(active_token, "active token");

      const url = `${CLIENT_URL}/active/${active_token}`;

      if (validateEmail(account)) {
        sendEmail(account, url, "Verify your email address.");

        res.json({
          msg: "Success! Please check your email.",
        });
      } else if (validPhone(account)) {
        sendSms(account, url, "Verify your phone number.");
        res.json({
          msg: "Success! Please check phone.",
        });
      }
    } catch (err: any) {
      return res.status(500).json({ mss: err.message });
    }
  },
  activeAccount: async (req: Request, res: Response) => {
    try {
      const { active_token } = req.body;

      const decoded = <IDecodedToken>(
        jwt.verify(active_token, `${process.env.ACTIVE_TOKEN_SECRET}`)
      );

      const { newUser } = decoded;

      if (!newUser)
        return res.status(400).json({ msg: "Invalid authentication" });

      const user = new Users(newUser);

      await user.save();

      res.json({
        msg: "Account has been activated!",
      });
    } catch (error: any) {
      let errMsg;
      if (error.code === 11000) {
        errMsg = Object.keys(error.keyValue)[0] + " already exists";
      } else {
        let name = Object.keys(error.errors)[0];
        errMsg = error.errors[`${name}`].message;
      }
      return res.status(500).json({ mss: errMsg });
    }
  },
  login: async (req: Request, res: Response) => {
    try {
      const { account, password } = req.body;

      const user = await Users.findOne({ account });
      if (!user)
        return res.status(400).json({ msg: "This account does not exist" });

      loginUser(user, password, res);
    } catch (err: any) {
      return res.status(500).json({ mss: err.message });
    }
  },
  logout: async (req: Request, res: Response) => {
    try {
      res.clearCookie("refreshtoken", { path: `/api/refresh_token` });
      return res.json({ msg: "Logged out!" });
    } catch (err: any) {
      return res.status(500).json({ mss: err.message });
    }
  },
  refreshToken: async (req: Request, res: Response) => {
    try {
      const rf_token = req.cookies.refreshtoken;

      if (!rf_token) return res.status(400).json({ msg: "Please login now!" });
      const decoded = <IDecodedToken>(
        jwt.verify(rf_token, `${process.env.REFRESH_TOKEN_SECRET}`)
      );

      if (!decoded.id)
        return res.status(400).json({ msg: "Please login now!" });

      const user = await Users.findById(decoded.id).select("-password");

      if (!user)
        return res.status(400).json({ msg: "This account does not exist" });

      const access_token = generateAccessToken({ id: user._id });

      res.json({ access_token });
    } catch (err: any) {
      return res.status(500).json({ mss: err.message });
    }
  },
};

const loginUser = async (user: IUser, password: string, res: Response) => {
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Password is incorrect" });

  const access_token = generateAccessToken({ id: user._id });
  const refresh_token = generateRefreshToken({ id: user._id });

  res.cookie("refreshtoken", refresh_token, {
    httpOnly: true,
    path: `/api/refresh_token`,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    msg: "Login Success",
    access_token,
    user: { ...user._doc, password: "" },
  });
};

export default authCtrl;
