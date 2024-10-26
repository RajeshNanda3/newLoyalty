import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Server is Ready");
});

// get a list of 5 jokes
app.get("/jokes", (req, res) => {
  const jokes = [
    {
      id: 1,
      title: "A Joke",
      content: "This is a Joke",
    },
    {
      id: 2,
      title: "A Joke 2",
      content: "This is a Joke no 2",
    },
    {
      id: 3,
      title: "A Joke 3",
      content: "This is a Joke no 3",
    },
    {
      id: 4,
      title: "A Joke 4",
      content: "This is a Joke no 4",
    },
    {
      id: 5,
      title: "A Joke 5",
      content: "This is a Joke no 5",
    },
    {
      id: 6,
      title: "A Joke 6",
      content: "This is a Joke no 6",
    },
  ];
  res.json(jokes);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is at http://localhost:${port}`);
});
