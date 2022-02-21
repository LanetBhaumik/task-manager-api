const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();

//new task creation
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

//get all tasks?completed=false
//GET /task?limit=10&skip=0
//GET /tasks?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }
  try {
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send();
  }
});

//get task by id
router.get("/tasks/:taskId", auth, async (req, res) => {
  try {
    // await req.user.populate("tasks");
    // const userTasks = user.tasks;
    // const task = await userTasks.find((tsk) => {
    //   return tsk._id === req.params.taskId;
    // });

    const _id = req.params.taskId;
    const task = await Task.findOne({ _id, owner: req.user._id });
    console.log(task);
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

//update task by id
router.patch("/tasks/:taskId", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedupdates = ["description", "completed"];
  const isValidOperation = updates.every((update) => {
    return allowedupdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      owner: req.user._id,
    });
    if (!task) {
      console.log(task);
      return res.status(404).send();
    }
    updates.forEach((update) => {
      task[update] = req.body[update];
    });
    await task.save();

    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Delete task by id
router.delete("/tasks/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

module.exports = router;
