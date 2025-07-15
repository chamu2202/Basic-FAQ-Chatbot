const faqPatterns = [
  {
    category: "greetings",
    patterns: ["hi", "hello", "how are you", "hey"],
    response: "Hello! How can I help you today? 😊"
  },
  {
    category: "weather",
    patterns: ["weather", "temperature", "forecast"],
    response: "Today's weather is sunny with mild temperatures!"
  },
  {
    category: "time",
    patterns: ["time", "date", "day"],
    response: `The current date and time is ${new Date().toLocaleString()}.`
  },
  {
    category: "help",
    patterns: ["help", "support", "contact"],
    response: "Sure! You can contact support at support@example.com."
  },
  {
    category: "company",
    patterns: ["about", "services", "pricing"],
    response: "We offer web design, development, and hosting at competitive prices."
  }
];

export default faqPatterns;

export const fallbackResponse = "Sorry, I didn't understand that. Can you please rephrase? 🤔";
