const getHealth = (req, res) => {
  res.status(200).json({
    message: "Footkinator Backend Running",
  });
};

module.exports = {
  getHealth,
};
