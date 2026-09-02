import type { UserData } from "@/types/userData"

// Sample data for the profile
export const userData: UserData = {
  name: "Darlene Robertson",
  title: "B-Tech, 2nd year",
  email: "deanna.curtis@example.com",
  phone: "+91 89675-56543",
  location: "Vijay Nagar, Indore",
  website: "http://www.faxquote.com",
  education: {
    collegeName: "Indian Institute of Technology Indore",
    degree: "B.Tech in computer science",
    startDate: "01 July 2025",
    endDate: "31 March 2028",
    description:
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
  },
  skills: {
    softwareKnowledge: ["Adobe Illustrator", "Adobe Photoshop", "Adobe XD", "Figma", "Sketch", "Figma"],
    achievements: ["Python", "Java", "JavaScript"],
    codingLanguages: ["Python", "Java", "C++", "PHP", "Ruby", "JavaScript", "HTML", "CSS"],
    languages: ["English", "Hindi", "Spanish"],
  },
  portfolio: {
    url: "http://www.zencorporation.com",
  },
}
