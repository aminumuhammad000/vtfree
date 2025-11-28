import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  Send,
  HelpCircle,
  Book,
  Video,
  Search,
  ChevronRight
} from 'lucide-react';

interface SupportProps {
  onNavigate: (page: string) => void;
}

export function Support({ onNavigate }: SupportProps) {
  const [ticketData, setTicketData] = useState({
    subject: '',
    message: '',
    category: 'general'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const contactOptions = [
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      description: 'Chat with us instantly',
      action: 'Open WhatsApp',
      color: '#25D366',
      link: 'https://wa.me/1234567890'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@vtfree.com',
      action: 'Send Email',
      color: '#16A34A',
      link: 'mailto:support@vtfree.com'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: '+234 800 000 0000',
      action: 'Call Now',
      color: '#22C55E',
      link: 'tel:+2348000000000'
    }
  ];

  const faqs = [
    {
      question: 'How long does it take to build an app?',
      answer: 'Building your app typically takes 3-5 minutes, depending on your selected features and platforms.'
    },
    {
      question: 'Can I customize my app after building?',
      answer: 'Yes! You can rebuild your app anytime with new configurations from your dashboard.'
    },
    {
      question: 'What payment gateways are supported?',
      answer: 'We support Paystack, Flutterwave, and Monnify for processing payments in your app.'
    },
    {
      question: 'How do I get my API keys?',
      answer: 'Get your API keys from your VTU provider dashboard (SMEplug, Hawk, or ClubKonnect).'
    },
    {
      question: 'Can I publish to Google Play Store?',
      answer: 'Yes, we can help you publish your app to the Play Store. Additional fees apply.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, you can build your first app for free to test all features.'
    }
  ];

  const guides = [
    {
      icon: Book,
      title: 'Getting Started Guide',
      description: 'Learn the basics of VTfree',
      duration: '5 min read'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      duration: '15 videos'
    },
    {
      icon: HelpCircle,
      title: 'Troubleshooting',
      description: 'Common issues and solutions',
      duration: '10 min read'
    }
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate ticket submission
    alert('Support ticket submitted successfully!');
    setTicketData({ subject: '', message: '', category: 'general' });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm p-4 sticky top-0 z-30"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h2>Support Center</h2>
            <p className="text-gray-600 text-sm">We're here to help</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16A34A] shadow-sm"
            />
          </div>
        </motion.div>

        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="mb-4">Contact Us</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {contactOptions.map((option, index) => (
              <motion.a
                key={index}
                href={option.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${option.color}20` }}
                >
                  <option.icon className="w-7 h-7" style={{ color: option.color }} />
                </div>
                <h3 className="mb-2">{option.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                <div className="flex items-center gap-2 text-sm" style={{ color: option.color }}>
                  <span>{option.action}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Quick Guides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3>Quick Guides</h3>
            <button
              onClick={() => onNavigate('documentation')}
              className="text-[#16A34A] text-sm"
            >
              View All
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {guides.map((guide, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('documentation')}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-[#16A34A] transition-colors text-left"
              >
                <guide.icon className="w-8 h-8 text-[#16A34A] mb-3" />
                <h3 className="mb-2">{guide.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{guide.description}</p>
                <p className="text-[#16A34A] text-xs">{guide.duration}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="mb-4">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between">
                  <span className="text-gray-900">{faq.question}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
                </summary>
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-gray-600 text-sm mt-3 pt-3 border-t border-gray-100"
                >
                  {faq.answer}
                </motion.p>
              </motion.details>
            ))}
          </div>
        </motion.div>

        {/* Submit Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="mb-4">Submit a Support Ticket</h3>
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Category</label>
              <select
                value={ticketData.category}
                onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                <option value="general">General Question</option>
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing</option>
                <option value="feature">Feature Request</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={ticketData.subject}
                onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                placeholder="Brief description of your issue"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Message</label>
              <textarea
                value={ticketData.message}
                onChange={(e) => setTicketData({ ...ticketData, message: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                rows={5}
                placeholder="Provide detailed information about your issue..."
                required
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Submit Ticket
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
