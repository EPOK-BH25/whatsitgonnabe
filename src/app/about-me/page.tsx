import React from 'react';

const AboutMe: React.FC = () => {
  return (
    <div className="about-me-container bg-background text-foreground py-8 px-4">
      {/* Intro Section */}
      <section className="intro-section text-center mb-16">
        <h1 className="text-3xl font-semibold mb-4">Why We Built This Website</h1>
        <p className="text-lg text-muted-foreground">
          We wanted to create a space where we could showcase our skills, share our stories,
          and connect with like-minded individuals. This website is a personal project where
          we aim to demonstrate our web development abilities and give you a glimpse of our work.
        </p>
      </section>

      {/* Team Section */}
      <section className="team-section text-center">
        <h2 className="text-2xl font-semibold mb-8">Meet Our Team</h2>
        <div className="team-boxes grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Team Member 1 */}
          <div className="team-member bg-card p-6 rounded-xl shadow-lg">
            <img
              src="https://media.licdn.com/dms/image/v2/D5635AQHT0tGak7yjIA/profile-framedphoto-shrink_800_800/B56ZX0wEoOGoAg-/0/1743567997832?e=1745665200&v=beta&t=sSz64P8dtcNKr2z_u9KIOFYgX_RPMJ2qpERC8m-_QD0"
              alt="Person 1"
              className="team-photo rounded-full w-36 h-36 object-cover mx-auto mb-4"
            />
            <div className="team-text">
              <h3 className="text-xl font-semibold mb-2">Person 1</h3>
              <p className="text-lg text-muted-foreground">
                Person 1 is passionate about web development, particularly working with front-end
                frameworks like React and Next.js. They love building interactive and user-friendly
                web applications.
              </p>
            </div>
          </div>

          {/* Team Member 2 */}
          <div className="team-member bg-card p-6 rounded-xl shadow-lg">
            <img
              src="https://media.licdn.com/dms/image/v2/D5635AQHT0tGak7yjIA/profile-framedphoto-shrink_800_800/B56ZX0wEoOGoAg-/0/1743567997832?e=1745665200&v=beta&t=sSz64P8dtcNKr2z_u9KIOFYgX_RPMJ2qpERC8m-_QD0"
              alt="Person 2"
              className="team-photo rounded-full w-36 h-36 object-cover mx-auto mb-4"
            />
            <div className="team-text">
              <h3 className="text-xl font-semibold mb-2">Person 2</h3>
              <p className="text-lg text-muted-foreground">
                Person 2 specializes in back-end development, with experience in Node.js, Express,
                and databases like MongoDB. They are passionate about creating scalable and efficient systems.
              </p>
            </div>
          </div>

          {/* Team Member 3 */}
          <div className="team-member bg-card p-6 rounded-xl shadow-lg">
            <img
              src="https://media.licdn.com/dms/image/v2/D5635AQHT0tGak7yjIA/profile-framedphoto-shrink_800_800/B56ZX0wEoOGoAg-/0/1743567997832?e=1745665200&v=beta&t=sSz64P8dtcNKr2z_u9KIOFYgX_RPMJ2qpERC8m-_QD0"
              alt="Person 3"
              className="team-photo rounded-full w-36 h-36 object-cover mx-auto mb-4"
            />
            <div className="team-text">
              <h3 className="text-xl font-semibold mb-2">Person 3</h3>
              <p className="text-lg text-muted-foreground">
                Person 3 is a full-stack developer who enjoys working on both the front-end and back-end
                of web applications. They are always learning new technologies to keep up with the rapidly
                changing landscape of web development.
              </p>
            </div>
          </div>

          {/* Team Member 4 */}
          <div className="team-member bg-card p-6 rounded-xl shadow-lg">
            <img
              src="https://media.licdn.com/dms/image/v2/D5635AQHT0tGak7yjIA/profile-framedphoto-shrink_800_800/B56ZX0wEoOGoAg-/0/1743567997832?e=1745665200&v=beta&t=sSz64P8dtcNKr2z_u9KIOFYgX_RPMJ2qpERC8m-_QD0"
              alt="Person 4"
              className="team-photo rounded-full w-36 h-36 object-cover mx-auto mb-4"
            />
            <div className="team-text">
              <h3 className="text-xl font-semibold mb-2">Person 4</h3>
              <p className="text-lg text-muted-foreground">
                Person 4 has a keen interest in UI/UX design and believes in the importance of creating
                intuitive and visually appealing web interfaces. They enjoy experimenting with CSS and JavaScript.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutMe;
