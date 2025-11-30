import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import './Contact.css';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const locations = [
    {
      name: "BGC Branch",
      address: "123 Coffee Street, Bonifacio Global City, Taguig",
      phone: "+63 2 8123 4567",
      hours: "6:00 AM - 10:00 PM"
    },
    {
      name: "Makati Branch", 
      address: "456 Business Ave, Makati City",
      phone: "+63 2 8765 4321",
      hours: "6:00 AM - 11:00 PM"
    },
    {
      name: "Ortigas Branch",
      address: "789 Corporate Blvd, Pasig City",
      phone: "+63 2 8555 0123",
      hours: "6:30 AM - 9:30 PM"
    }
  ];

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <h1>Get In Touch</h1>
          <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </section>

      <section className="contact-content section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-form-section">
              <h2>Send us a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary submit-btn">
                  <Send size={20} />
                  Send Message
                </button>
              </form>
            </div>

            <div className="contact-info-section">
              <h2>Contact Information</h2>
              
              <div className="contact-info">
                <div className="info-item">
                  <div className="info-icon">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3>Email</h3>
                    <p>contact@ezdevscoffee.com</p>
                    <p>support@ezdevscoffee.com</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3>Phone</h3>
                    <p>+63 2 8123 4567</p>
                    <p>+63 917 123 4567</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3>Customer Service Hours</h3>
                    <p>Monday - Friday: 8:00 AM - 8:00 PM</p>
                    <p>Saturday - Sunday: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="locations-section section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Our Locations</h2>
            <p>Visit us at any of our convenient locations</p>
          </div>

          <div className="locations-grid grid grid-3">
            {locations.map((location, index) => (
              <div key={index} className="location-card">
                <h3>{location.name}</h3>
                <div className="location-info">
                  <div className="location-item">
                    <MapPin size={18} />
                    <span>{location.address}</span>
                  </div>
                  <div className="location-item">
                    <Phone size={18} />
                    <span>{location.phone}</span>
                  </div>
                  <div className="location-item">
                    <Clock size={18} />
                    <span>{location.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;