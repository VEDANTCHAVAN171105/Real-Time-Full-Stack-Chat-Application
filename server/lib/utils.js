import jwt from "jsonwebtoken"

//Function To Generate A Token For A User
export const generateToken = (userId)=>{
    const token = jwt.sign({userId}, process.env.JWT_SECRET);
    return token;
}