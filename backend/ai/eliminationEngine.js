const filterCandidates = (candidates, attribute, value, answer) => {
  if (answer === "unknown") return candidates;
  return candidates.filter((player) => {
    const isMatch = player[attribute] === value;
    return answer ? isMatch : !isMatch;
  });
};

module.exports = {
  filterCandidates,
};
