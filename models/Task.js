const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
    title: {
    type: String,
    required: true,
    trim: true,
    },

    description: {
    type: String,
    required: true,
    trim: true,
    },

    assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
     required: true,
        },

    createdBy: {
     type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    },

   status: {
    type: String,
     enum: ["Pending", "In Progress", "Completed"],
     default: "Pending",
        },

    priority: {
    type: String,
     enum: ["Low", "Medium", "High"],
     default: "Medium",
        },

  dueDate: {
    type: Date,
     required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Task", taskSchema);