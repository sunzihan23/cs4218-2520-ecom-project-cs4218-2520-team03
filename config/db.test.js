// Chen Peiran, A0257826R
import mongoose from "mongoose";
import connectDB from "./db.js";

jest.mock("mongoose", () => ({
    connect: jest.fn(),
}));

describe("Database Connection", () => {
    let consoleLogSpy;
    const mockUrl = "mongodb://mocked-url:27017/test";

    beforeEach(() => {
        process.env.MONGO_URL = mockUrl;
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => { });
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    it("should log a successful message when connecting to MongoDB successfully", async () => {
        const mockConnection = { connection: { host: "localhost" } };
        mongoose.connect.mockResolvedValue(mockConnection);

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Connected To Mongodb Database")
        );
    });

    it("should log an error message when MongoDB connection fails", async () => {
        const error = new Error("Connection failed");
        mongoose.connect.mockRejectedValue(error);

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Error in Mongodb")
        );
    });

});