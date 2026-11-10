const Task = require("../models/Task");
const User = require("../models/User");

const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,
            priority,
            dueDate,
        } = req.body;

        if (!title || !description || !assignedTo || !dueDate) {
            return res.status(400).json({
                message: "All required fields must be provided",
            });
        }

        const assignedUser = await User.findById(assignedTo);

        if (!assignedUser) {
            return res.status(404).json({
                message: "Assigned user not found",
            });
        }

        // Validate due date
        if (new Date(dueDate) <= new Date()) {
            return res.status(400).json({
                message: "Due date must be in the future",
            });
        }

        const task = await Task.create({
            title,
            description,
            assignedTo,
            createdBy: req.user._id,
            priority: priority || "Medium",
            dueDate,
        });

        return res.status(201).json({
            message: "Task created successfully",
            task,
        });

    } catch (error) {
        console.error("Create task error:", error.message);

        return res.status(500).json({
            message: "Failed to create task",
        });
    }
};

const getAllTasks = async (req, res) => {
    try {
        let filter = {};

    if (req.user.role === "manager") {
            filter.createdBy = req.user._id;
     } else if (req.user.role === "user") {
            filter.assignedTo = req.user._id;
        }

     if (req.query.status) {
            filter.status = req.query.status;
     }

     if (req.query.priority) {
            filter.priority = req.query.priority;
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const [tasks, totalTasks] = await Promise.all([
            Task.find(filter)
                .populate("assignedTo", "userName email role")
                .populate("createdBy", "userName email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Task.countDocuments(filter),
        ]);

        return res.status(200).json({
            message: "Tasks fetched successfully",
            tasks,
            pagination: {
                totalTasks,
                currentPage: page,
                totalPages: Math.ceil(totalTasks / limit),
                limit,
            },
        });

    } catch (error) {
        console.error("Get tasks error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch tasks",
        });
    }
};



const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate("assignedTo", "userName email role")
            .populate("createdBy", "userName email role");

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        const isAdmin = req.user.role === "admin";

        const isManager =
            req.user.role === "manager" &&
            task.createdBy._id.equals(req.user._id);

        const isAssignedUser =
            req.user.role === "user" &&
            task.assignedTo._id.equals(req.user._id);

        if (!isAdmin && !isManager && !isAssignedUser) {
            return res.status(403).json({
                message: "You are not allowed to view this task",
            });
        }

        return res.status(200).json({
            message: "Task fetched successfully",
            task,
        });

    } catch (error) {
        console.error("Get task error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch task",
        });
    }
};


const updateTask = async (req, res) => {
    try {
    const task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({
                message: "Task not found",
            });
    }

    const isAdmin = req.user.role === "admin";

     const isManager =
        req.user.role === "manager" &&
            task.createdBy.equals(req.user._id);

    const isAssignedUser =
        req.user.role === "user" &&
            task.assignedTo.equals(req.user._id);

    if (isAdmin || isManager) {
            const {
                title,
                description,
                assignedTo,
                priority,
                status,
                dueDate,
            } = req.body;

         if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority !== undefined) task.priority = priority;
        if (status !== undefined) task.status = status;

         if (assignedTo !== undefined) {
             const assignedUser = await User.findById(assignedTo);

         if (!assignedUser) {
                    return res.status(404).json({
                        message: "Assigned user not found",
                    });
                }

                task.assignedTo = assignedTo;
            }

            if (dueDate !== undefined) {
                if (new Date(dueDate) <= new Date()) {
                    return res.status(400).json({
                        message: "Due date must be in the future",
                    });
                }

                task.dueDate = dueDate;
            }

        } else if (isAssignedUser) {

            const allowedStatuses = [
                "Pending",
                "In Progress",
                "Completed",
            ];

            if (
                !req.body.status ||
                !allowedStatuses.includes(req.body.status)
            ) {
                return res.status(400).json({
                    message: "Please provide a valid task status",
                });
            }

            task.status = req.body.status;

        } else {
            return res.status(403).json({
                message: "You are not allowed to update this task",
            });
        }

        await task.save();

        return res.status(200).json({
            message: "Task updated successfully",
            task,
        });

    } catch (error) {
        console.error("Update task error:", error.message);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to update task",
        });
    }
};



const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        const isAdmin = req.user.role === "admin";

        const isManager =
            req.user.role === "manager" &&
            task.createdBy.equals(req.user._id);

        if (!isAdmin && !isManager) {
            return res.status(403).json({
                message: "You are not allowed to delete this task",
            });
        }

        await Task.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Task deleted successfully",
        });

    } catch (error) {
        console.error("Delete task error:", error.message);

        return res.status(500).json({
            message: "Failed to delete task",
        });
    }
};


module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
};