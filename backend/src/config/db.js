const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        const safeMessage = error.message.replace(
            /mongodb(?:\+srv)?:\/\/\S+/gi,
            "[redacted MongoDB URI]"
        );
        console.error("MongoDB Connection Failed:", {
            name: error.name,
            code: error.code,
            message: safeMessage
        });
        process.exit(1);
    }
};

module.exports = connectDB;