/**
 * Notification Service (Mock implementation for Phase 1)
 * In Phase 2+, this will integrate with real email/SMS providers
 */
class NotificationService {
  async sendNotification(config) {
    const { channel, recipient, template, data } = config;

    console.log(`[MOCK] Sending ${channel} notification to ${recipient}`);
    console.log(`[MOCK] Template: ${template}`);
    console.log(`[MOCK] Data:`, JSON.stringify(data, null, 2));

    // Simulate async operation
    await this.delay(100);

    // Mock different channels
    switch (channel) {
      case "email":
        return this.sendEmail(recipient, template, data);
      case "sms":
        return this.sendSms(recipient, template, data);
      case "push":
        return this.sendPush(recipient, template, data);
      case "inapp":
        return this.sendInApp(recipient, template, data);
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  async sendEmail(recipient, template, data) {
    console.log(`[EMAIL] To: ${recipient}`);
    console.log(`[EMAIL] Subject: ${this.getEmailSubject(template)}`);
    console.log(`[EMAIL] Body: ${this.getEmailBody(template, data)}`);

    return {
      success: true,
      channel: "email",
      recipient,
      messageId: `email-${Date.now()}`,
      sentAt: new Date().toISOString(),
    };
  }

  async sendSms(recipient, template, data) {
    console.log(`[SMS] To: ${recipient}`);
    console.log(`[SMS] Message: ${this.getSmsMessage(template, data)}`);

    return {
      success: true,
      channel: "sms",
      recipient,
      messageId: `sms-${Date.now()}`,
      sentAt: new Date().toISOString(),
    };
  }

  async sendPush(recipient, template, data) {
    console.log(`[PUSH] To: ${recipient}`);
    console.log(`[PUSH] Title: ${this.getPushTitle(template)}`);
    console.log(`[PUSH] Body: ${this.getPushBody(template, data)}`);

    return {
      success: true,
      channel: "push",
      recipient,
      messageId: `push-${Date.now()}`,
      sentAt: new Date().toISOString(),
    };
  }

  async sendInApp(recipient, template, data) {
    console.log(`[IN-APP] To: ${recipient}`);
    console.log(
      `[IN-APP] Notification: ${this.getInAppMessage(template, data)}`
    );

    return {
      success: true,
      channel: "inapp",
      recipient,
      messageId: `inapp-${Date.now()}`,
      sentAt: new Date().toISOString(),
    };
  }

  getEmailSubject(template) {
    const subjects = {
      "order-approval-request": "Order Approval Required",
      "order-confirmed": "Order Confirmed",
      "order-rejected": "Order Rejected",
    };
    return subjects[template] || "Notification";
  }

  getEmailBody(template, data) {
    const bodies = {
      "order-approval-request": `Order #${
        data.orderId || "N/A"
      } requires your approval. Value: $${data.orderValue || 0}`,
      "order-confirmed": `Order #${data.orderId || "N/A"} has been confirmed.`,
      "order-rejected": `Order #${data.orderId || "N/A"} has been rejected.`,
    };
    return bodies[template] || "You have a new notification.";
  }

  getSmsMessage(template, data) {
    return this.getEmailBody(template, data); // Reuse for simplicity
  }

  getPushTitle(template) {
    return this.getEmailSubject(template); // Reuse for simplicity
  }

  getPushBody(template, data) {
    return this.getEmailBody(template, data); // Reuse for simplicity
  }

  getInAppMessage(template, data) {
    return this.getEmailBody(template, data); // Reuse for simplicity
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new NotificationService();
