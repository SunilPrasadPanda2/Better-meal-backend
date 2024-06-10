import mongoose, { Schema } from "mongoose";

const TagSchema = new Schema({
    tagName: {
        type: String,
        required: true
    }
});

const Tag = mongoose.model('Tag', TagSchema);

export default Tag;