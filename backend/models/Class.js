
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    number: {
        type: String,
        required: true,
    },
    syllabus: {
        type: String,
        required: false,
    },
    userID : {
        type: String,
        required: true,
    },
    chapters: [{ type: Schema.Types.ObjectId, ref: 'Chapter' }]
});


classSchema.methods.calculateProgress = async function() {
    const Chapter = mongoose.model('Chapter');
    if (!this.chapters || this.chapters.length === 0) {
        return {
            completedChapters: 0,
            totalChapters: 0,
            progressPercentage: 0
        };
    }
    
    // Get chapters with completion status
    const chapters = await Chapter.find({
        _id: { $in: this.chapters }
    });
    
    const completedChapters = chapters.filter(ch => ch.isCompleted).length;
    const totalChapters = chapters.length;
    
    return {
        completedChapters,
        totalChapters,
        progressPercentage: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
    };
};

module.exports = mongoose.model('Class', classSchema);
