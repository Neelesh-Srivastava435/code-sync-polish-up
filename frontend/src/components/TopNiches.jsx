
const TopNiches = () => {
  const services = [
    {
      id: 1,
      service: "Software Development",
      description:
        "End-to-end software development services, delivering high-quality, scalable, and secure applications tailored to meet business objectives.",
    },
    {
      id: 2,
      service: "Web Development",
      description:
        "Full-stack web development, creating dynamic, responsive, and user-centric websites with robust back-end systems to drive online success.",
    },
    {
      id: 3,
      service: "Data Science & Analytics",
      description:
        "Leveraging advanced analytics and machine learning to unlock data-driven insights, driving strategic business decisions and innovation.",
    },
    {
      id: 4,
      service: "Cloud Solutions",
      description:
        "Comprehensive cloud services, including architecture, migration, and management, ensuring scalable, cost-effective, and secure cloud environments.",
    },
    {
      id: 5,
      service: "DevOps & Continuous Integration",
      description:
        "Enhancing collaboration and efficiency through DevOps practices, with automated CI/CD pipelines to streamline software delivery and operations.",
    },
    {
      id: 6,
      service: "Mobile App Development",
      description:
        "Building feature-rich, user-friendly mobile applications for iOS and Android, designed to provide seamless experiences across devices.",
    },
    {
      id: 7,
      service: "UI/UX Design",
      description:
        "Crafting intuitive and visually appealing user interfaces with a focus on user experience, ensuring products are both functional and engaging.",
    },
    {
      id: 8,
      service: "Cybersecurity",
      description:
        "Providing advanced cybersecurity services to protect businesses from evolving threats, ensuring data privacy and regulatory compliance.",
    },
    {
      id: 9,
      service: "Artificial Intelligence & Machine Learning",
      description:
        "Implementing AI and ML solutions to automate processes, enhance decision-making, and provide personalized user experiences.",
    },
    {
      id: 10,
      service: "Blockchain Development",
      description:
        "Offering blockchain solutions to enhance transparency, security, and efficiency across various industries, from finance to supply chain management.",
    },
    {
      id: 11,
      service: "Digital Marketing",
      description:
        "Delivering strategic digital marketing services, including SEO, content marketing, and social media management, to boost online presence and engagement.",
    },
    {
      id: 12,
      service: "E-commerce Solutions",
      description:
        "Providing comprehensive e-commerce development services, enabling businesses to sell online with robust, scalable, and secure platforms.",
    },
  ];

  return (
    <section className="services">
      <h3>Top Niches</h3>
      <div className="grid">
        {services.map((element) => {
          return (
            <div className="card" key={element.id}>
              <h4>{element.service}</h4>
              <p>{element.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TopNiches;
