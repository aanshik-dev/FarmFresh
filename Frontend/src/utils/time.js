const getTime = (timeStamp) => {
  const formattedTime = timeStamp
    ? new Date(timeStamp).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      })
    : "--";
  return formattedTime;
};

export default getTime;
