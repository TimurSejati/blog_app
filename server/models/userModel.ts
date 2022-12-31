import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    namae: {
      type: String,
      required: [true, "Pleas add your name"],
      trim: true,
      maxLength: [20, "Your name is up to 20 chars long."],
    },
    account: {
      type: String,
      required: [true, "Please add your email or phone"],
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please add your password"],
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/radhasjt/image/upload/v1605273538/Assets/230-2301779_best-classified-apps-default-user-profile_bkbdzj.jpg",
    },
    role: {
      type: String,
      default: "user",
    },
    type: {
      type: String,
      default: "normal",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
