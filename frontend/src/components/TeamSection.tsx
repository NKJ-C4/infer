import React from 'react';
import { Users, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { TeamMember } from '../types';

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Alex Chen',
    role: 'Chief Data Scientist',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Previously led AI/ML initiatives at Google Cloud. PhD in Computer Science with focus on NLP and database systems.'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'Head of Engineering',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Former Engineering Director at Snowflake. Expert in distributed systems and large-scale data processing architectures.'
  },
  {
    id: '3',
    name: 'Miguel Santana',
    role: 'UX/UI Lead',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Award-winning designer with 10+ years experience creating intuitive data visualization interfaces for enterprise products.'
  },
  {
    id: '4',
    name: 'Priya Sharma',
    role: 'Database Architect',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Database optimization expert with deep expertise in SQL query performance tuning and cloud data warehousing.'
  }
];

const TeamSection: React.FC = () => {
  return (
    <section className="w-full py-10 px-4 transition-colors duration-300 mb-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-8">
          <Users className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Meet Our Team
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {teamMembers.map(member => (
            <div 
              key={member.id}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-6 flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden">
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    {member.name}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {member.bio}
                  </p>
                  <div className="flex space-x-3">
                    <button className="p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                      <Linkedin className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl overflow-hidden shadow-lg">
          <div className="px-8 py-10 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Join Our Growing Team
            </h3>
            <p className="opacity-90 mb-6">
              We're on a mission to make data analysis accessible to everyone through natural language. 
              Our team combines expertise in NLP, databases, and user experience to build the future of analytics.
            </p>
            <button className="px-5 py-2 bg-white text-indigo-600 hover:bg-gray-100 rounded-lg font-medium flex items-center transition-colors duration-200">
              View Open Positions
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;