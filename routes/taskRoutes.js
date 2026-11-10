const express = require("express");
const router = express.Router();

const {
    createTask,getAllTasks,getTaskById,updateTask,deleteTask,} = require("../controllers/taskController");

const {authMiddleware,roleMiddleware,} = require("../middleware/authMiddleware");



router.post( "/create",authMiddleware,roleMiddleware("admin", "manager"),createTask);


router.get(
    "/all",
    authMiddleware,
    roleMiddleware("admin", "manager", "user"),
    getAllTasks
);


router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("admin", "manager", "user"),
    getTaskById
);



router.put(
    "/update/:id",
    authMiddleware,
    roleMiddleware("admin", "manager", "user"),
    updateTask
);


router.delete(
    "/delete/:id",
    authMiddleware,
    roleMiddleware("admin", "manager"),
    deleteTask
);


module.exports = router;