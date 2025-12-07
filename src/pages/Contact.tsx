import React from 'react';
import { Link } from 'react-router-dom';
import { X, Twitter, Linkedin, Mail } from 'lucide-react';

const Contact = () => {
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
          <h1 className="font-beth-ellen text-2xl">Contact</h1>
          <div className="space-y-6 text-muted-foreground">
            <p className="text-lg">
              Feel free to reach out to me on social media:
            </p>
            <div className="space-y-4">
              <a
                href="https://twitter.com/estsauver"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lg hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
                @estsauver
              </a>
              <a
                href="https://www.linkedin.com/in/estsauver/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lg hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                LinkedIn Profile
              </a>
              <div className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5" />
                My email is my twitter handle at gmail dot com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
