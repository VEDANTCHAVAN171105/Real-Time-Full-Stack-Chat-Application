import mongoose from "mongoose";

const isPlaceholder = (value) => /<[^>]+>|YOUR_|REPLACE_ME/i.test(value);

mongoose.connection.on("connected", () => {
    console.log("Database Connected");
});

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        const error = new Error("MONGODB_URI is missing from server/.env");
        error.code = "MONGODB_CONFIGURATION";
        throw error;
    }

    if (isPlaceholder(uri)) {
        const error = new Error(
            "MONGODB_URI still contains a placeholder. Replace it with your MongoDB Atlas connection string."
        );
        error.code = "MONGODB_CONFIGURATION";
        throw error;
    }

    const connectionParts = uri.match(/^mongodb(?:\+srv)?:\/\/([^/?#]+)(?:[/?#]|$)/i);
    const hosts = connectionParts?.[1].slice(connectionParts[1].lastIndexOf("@") + 1);
    if (!hosts || /\s/.test(hosts)) {
        const error = new Error("MONGODB_URI must use mongodb:// or mongodb+srv:// and include a hostname.");
        error.code = "MONGODB_CONFIGURATION";
        throw error;
    }

    await mongoose.connect(uri, {
        dbName: "chat-app",
    });
};