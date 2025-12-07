import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const About = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="glass-panel border-none rounded-lg p-6 max-w-lg w-full mx-4 relative">
        <Link
          to="/"
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Link>

        <div className="space-y-4">
          <h1 className="font-beth-ellen text-2xl">About Me</h1>
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>
              I'm Earl St Sauver. I build things that matter with people I admire.
            </p>

            <p>
              I co-founded Apollo Agriculture because I believe everyone deserves access to
              the tools that help farmers thrive. With Eli and Ben, we set out to make
              modern agriculture accessible to smallholder farmers across Africa.
            </p>

            <p>
              While I'm drawn to barely possible problems, I'm now a Dad with two
              children, so I am trying to learn that I have limits.
            </p>

            <p>
              When I'm not working, I'm hopefully enjoying a nice bike ride or spending
              time in the outdoors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
