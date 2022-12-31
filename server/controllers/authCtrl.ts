import { Request, Response } from "express";
import Users from "../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateActiveToken } from "../config/generateToken";

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

      const active_token = generateActiveToken(newUser);

      res.json({
        status: "OK",
        msg: "Register suuccesfully",
        data: newUser,
        active_token,
      });
    } catch (err: any) {
      return res.status(500).json({ mss: err.message });
    }
  },
};

export default authCtrl;
