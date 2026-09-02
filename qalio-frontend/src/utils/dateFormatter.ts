const formatDate = (date: Date | null | string) => {
  if (!date) return "Not set";
  // Convert to Date object if it's a string
  const dateObj = date instanceof Date ? date : new Date(date);
  // Format date
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // Format time in 12-hour format
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  return `${formattedDate} at ${formattedTime}`;
};
  export default formatDate