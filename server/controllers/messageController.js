require("dotenv").config();
const Messages = require("../models/messageModel");
const aes256 = require('aes256');

const cipher = aes256.createCipher(process.env.CIPHER);

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: cipher.decrypt(msg.message.text),
        time: msg.createdAt
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  //console.log(new Date().getTime());
  try {
    const { from, to, message } = req.body;
    const data = await Messages.create({
      message: { text: cipher.encrypt(message) },
      time: new Date(),
      users: [from, to],
      sender: from,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};
