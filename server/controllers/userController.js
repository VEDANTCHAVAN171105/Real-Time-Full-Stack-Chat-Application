import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

//SignUp New User
export const signup = async(req, res) => {
    const { fullName, email, password, bio } = req.body;

    try{
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const normalizedName = typeof fullName === "string" ? fullName.trim() : "";
        if(!normalizedName || !normalizedEmail || !password){
            return res.status(400).json({success: false, message: "Name, email, and password are required"})
        }
        if(password.length < 6){
            return res.status(400).json({success: false, message: "Password must be at least 6 characters"})
        }
        const user = await User.findOne({email: normalizedEmail});

        if(user){
            return res.status(409).json({success: false, message: "Account Already Exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName: normalizedName,
            email: normalizedEmail,
            password: hashedPassword,
            bio: typeof bio === "string" ? bio.trim() : ""
        });

        const token = generateToken(newUser._id)
        const userData = newUser.toObject();
        delete userData.password;

        res.status(201).json({success: true, userData, token, message: "Account Created Successfully"})

    }catch(error){
        if(error.code === 11000){
            return res.status(409).json({success: false, message: "Account Already Exists"})
        }
        console.error(error);
        res.status(500).json({success: false, message: "Unable to create account"})
    }
}

//Controller To Login A User
export const login = async(req, res) => {
    try{
        const { email, password } = req.body;
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if(!normalizedEmail || typeof password !== "string" || !password){
            return res.status(400).json({success: false, message: "Email and password are required"})
        }
        const userData = await User.findOne({email: normalizedEmail})

        if(!userData){
            return res.status(401).json({success: false, message: "Invalid Credentials"})
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if(!isPasswordCorrect){
            return res.status(401).json({success: false, message: "Invalid Credentials"})
        }

        const token = generateToken(userData._id)
        const safeUserData = userData.toObject();
        delete safeUserData.password;

        res.json({success: true, userData: safeUserData, token, message: "Login Successfully"})

    }catch(error){
        console.error(error);
        res.status(500).json({success: false, message: "Unable to log in"})
    }
}

//Controller to Check If User Is Authenticated
export const checkAuth = async(req, res) => {
    res.json({success: true, user: req.user});
}

//Controller To Update User Profile Details
export const updateProfile = async(req, res) => {
    try{
        const { profilePic, bio, fullName } = req.body;
        const userID = req.user._id;
        let updatedUser;

        if(!profilePic){
            // FIX: Assign the updated user to the variable
            updatedUser = await User.findByIdAndUpdate(userID, {bio, fullName}, {new: true});
        } else {
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(userID, {profilePic: upload.secure_url, bio, fullName}, {new: true});
        }
        
        res.json({success: true, user: updatedUser})
    } catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}