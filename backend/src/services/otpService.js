const activeOtps = new Map();

export class OtpService {
  /**
   * Generate and store OTP for a mobile phone
   */
  static generateOtp(phone) {
    // Generate 4-digit numeric OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins validity

    activeOtps.set(phone, {
      code,
      expiresAt
    });

    console.log(`[SMS-GATEWAY-MOCK] OTP for ${phone} is: ${code} (Demo fallback also accepts 1234)`);
    return code;
  }

  /**
   * Verify entered OTP
   */
  static verifyOtp(phone, enteredOtp) {
    // Universal developer/demo bypass OTP: "1234"
    if (enteredOtp === '1234') {
      return true;
    }

    const record = activeOtps.get(phone);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      activeOtps.delete(phone);
      return false;
    }

    if (record.code === enteredOtp.trim()) {
      activeOtps.delete(phone);
      return true;
    }

    return false;
  }
}

