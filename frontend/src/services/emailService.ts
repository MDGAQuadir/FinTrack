import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_gsdzmij'
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_98rtdcq'
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '4U1lNCzD86b5vxux9'

export interface EmailParams {
  name?: string
  from_name?: string
  user_name?: string
  email?: string
  from_email?: string
  user_email?: string
  reply_to?: string
  subject?: string
  title?: string
  message?: string
  category?: string
  priority?: string
  [key: string]: unknown
}

/**
 * Send an email via EmailJS with automatic param mapping
 */
export async function sendEmailJS(params: EmailParams): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const templateParams: Record<string, unknown> = {
      ...params,
      // Provide standard variable aliases so common EmailJS template variable names match automatically
      name: params.name || params.from_name || params.user_name || 'FinTrack User',
      from_name: params.from_name || params.name || params.user_name || 'FinTrack User',
      email: params.email || params.from_email || params.user_email || '',
      from_email: params.from_email || params.email || params.user_email || '',
      reply_to: params.reply_to || params.email || params.from_email || '',
      subject: params.subject || params.title || 'FinTrack Support Inquiry',
      message: params.message || '',
      category: params.category || 'General',
      priority: params.priority || 'Medium',
      date: new Date().toLocaleString('en-IN'),
    }

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    )

    return {
      success: response.status === 200,
      text: response.text,
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('EmailJS Send Error:', err)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
