import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitter,
  faFacebookSquare,
  faDribbble,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
export default function Footer() {
    return (
      <footer className="relative bg-footer text-footer-foreground pt-8 pb-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap text-left lg:text-left">
            <div className="w-full lg:w-6/12 px-4">
              <h4 className="text-3xl font-semibold">Supporting Your Up and Coming Business!</h4>
              <h5 className="text-lg mt-0 mb-2">
                Platform providing small roots a starting line.
              </h5>
              <div className="mt-6 flex gap-2">
                <SocialButton icon={faGithub} className="text-footer-foreground" />
              </div>
            </div>
  
            <div className="w-full lg:w-6/12 px-4 mt-8 lg:mt-0 flex justify-end">
              <FooterColumn
                title="Useful Links"
                links={[
                  ["About Us", "#"],
                  ["Github", "#"],
                ]}
              />
            </div>
          </div>
  
          <hr className="my-6 border-border" />
  
          <div className="flex justify-center">
            <div className="text-sm text-footer-foreground font-semibold py-1 text-center">
              © {new Date().getFullYear()}{" "}
              <a href="https://www.creative-tim.com" className="hover:underline">
                Creative Tim
              </a>
              . All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    );
  }
  

  function SocialButton({ icon }: { icon: any }) {
    return (
      <button
        type="button"
        className="bg-white text-black shadow-lg font-normal h-10 w-10 flex items-center justify-center rounded-full outline-none focus:outline-none"
      >
        <FontAwesomeIcon icon={icon} />
      </button>
    );
  }
  

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="w-full lg:w-4/12">
      <span className="block uppercase text-footer-foreground text-sm font-semibold mb-2">
        {title}
      </span>
      <ul className="list-none">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
            href={href}
            className="text-footer-foreground hover:underline font-semibold block pb-2 text-sm"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
