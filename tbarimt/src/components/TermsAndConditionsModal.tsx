'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface TermsAndConditionsModalProps {
  isOpen: boolean
  onClose?: () => void
  onAccept?: () => void
  showAcceptButton?: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Terms and Conditions content in Mongolian
const TERMS_CONTENT = `ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ
Сүүлд шинэчилсэн огноо: 2026 оны __ сарын __
Энэхүү үйлчилгээний нөхцөл (цаашид "Нөхцөл" гэх) нь "tbarimt ХХК" (цаашид "Платформ"
гэх)-ийн эзэмшиж, ажиллуулж буй вэбсайт болон гар утасны аппликэйшн, тэдгээртэй
холбогдох бүх дижитал үйлчилгээ (цаашид хамтад нь "Платформ" гэх)-ийг ашиглаж буй
аливаа хувь хүн, хуулийн этгээд (цаашид "Хэрэглэгч" гэх) ба Платформ хоорондын эрх,
үүрэг, хариуцлагыг зохицуулна.
Платформд бүртгүүлэх, нэвтрэх, контент үзэх, файл татах, файл байршуулах, худалдан
авалт хийх зэрэг аливаа хэлбэрээр Платформын үйлчилгээг ашиглаж буй этгээд нь энэхүү
Нөхцөлийг бүрэн уншиж, ойлгож, маргаангүйгээр хүлээн зөвшөөрсөнд тооцогдоно.
Энэхүү платформын зорилго нь хэрэглэгчдэд өөрийн бүтээл, судалгааны материал, тайлан
болон бусад хэрэгцээт контентыг үнэ тогтоож борлуулах боломж олгож, мөн бусад
хэрэглэгчдэд чанартай, цаг алдалгүй контент худалдан авах нөхцлийг бүрдүүлэхэд
оршино.
Түүнчлэн платформ нь контентыг хууль ёсны, аюулгүй орчинд байршуулж, хэрэглэгч ба
платформын эрх үүрэг, маргаан шийдвэрлэх процессийг тодорхой болгох замаар хоёр
талын ашиг сонирхлыг хамгаалах зорилготой.

1. ЕРӨНХИЙ ҮНДЭСЛЭЛ
1.1 Платформын тодорхойлолт
1.1.1"Платформ" гэж "tbarimt ХХК" -ийн эзэмшиж, ажиллуулж буй дараах бүх системийг
ойлгоно:
• вэбсайт
• гар утасны аппликэйшн
• сервер, өгөгдлийн сан
• төлбөрийн болон контент түгээлтийн дэд системүүд
1.1.2 Платформ нь хэрэглэгчдэд дижитал контент худалсах, худалдан авах боломж олгодог
онлайн зах зээлийн зуучлагч үйлчилгээ юм.
1.1.3 Платформ нь хэрэглэгчдийн байршуулсан контентын зохиогч, өмчлөгч биш бөгөөд
зөвхөн техникийн болон зохион байгуулалтын зуучлагчийн үүрэг гүйцэтгэнэ.
1.2 Хэрэглэгчийн тодорхойлолт
1.2.1 "Хэрэглэгч" гэж Платформд бүртгүүлэн Платформд нэвтэрч, мэдээлэл үзэх, контент
татах, худалдан авалт хийх, контент байршуулсан эсхүл бүртгэлгүйгээр нэвтэрсэн зэрэг
аливаа байдлаар Платформын үйлчилгээг ашиглаж буй аливаа хувь хүн, хуулийн этгээдийг
ойлгоно.
1.2.2 Хэрэглэгч нь дараах ангилалд хуваагдана:
a) Борлуулагч — Платформд контент байршуулж, борлуулалт хийж буй хэрэглэгч
b) Худалдан авагч — Платформоос контент худалдан авч ашиглаж буй хэрэглэгч
1.2.3 Нэг хэрэглэгч нь нэгэн зэрэг Борлуулагч болон Худалдан авагчийн статустай байж
болно.
1.2.4 Хэрэглэгч нь Платформыг ашигласнаар энэхүү нөхцөл, түүнтэй холбогдох бусад
бодлого, журмыг бүрэн дагаж мөрдөх үүрэг хүлээнэ.
1.3 Гэрээний хүчин төгөлдөр байдал
1.3.1 Энэхүү нөхцөл нь хэрэглэгч платформыг ашиглаж эхэлсэн мөчөөс эхлэн хүчин
төгөлдөр үйлчилнэ.
1.3.2 Хэрэглэгч нөхцөлийг зөвшөөрөхгүй тохиолдолд Платформын үйлчилгээг ашиглах
эрхгүй.
1.3.3 Платформ нь нөхцөлийг шинэчлэх, өөрчлөх эрхтэй бөгөөд өөрчлөлтийг платформ дээр
нийтэлснээр хүчин төгөлдөр болно.

2. ТАЛУУДЫН ЭРХ, ҮҮРЭГ
2.1 Платформын үүрэг
2.1.1 Платформ нь үйлчилгээний хэвийн, тасралтгүй ажиллагааг хангах үүрэгтэй.
2.1.2 Платформ нь хэрэглэгчийн хувийн мэдээллийг нууцлалын бодлогын дагуу хамгаалах
үүрэгтэй.
2.1.3 Байршуулагдсан контентыг чанарын болон хууль ёсны шаардлагад нийцэх эсэхийг
урьдчилан шалгах, шаардлагатай тохиолдолд хэрэглэгчтэй зөвшилцөх үүрэгтэй.
2.1.4 Хэрэглэгчийн эрх, үүргийг хангах, маргаан гарах, гуравдагч этгээдийн гомдлыг
шийдвэрлэхэд шаардлагатай зохих арга хэмжээг авах үүрэгтэй. 
2.2 Платформын эрх
Платформ нь дараах эрхийг эдэлнэ:
2.2.1 Байршуулагдах бүх контентыг нийтлэхээс өмнө шалгах, батлах, татгалзах,
засварлахыг шаардах.
2.2.2 Дараах тохиолдолд контентыг урьдчилан мэдэгдэл илгээн устгах:
• хууль зөрчсөн,
• зохиогчийн эрх зөрчсөн,
• чанарын шаардлага хангахгүй,
• бусад хэрэглэгчдэд төөрөгдөл үүсгэх агуулгатай.
2.2.3 Гуравдагч этгээдээс ирсэн мэдэгдлийг хүлээн авч, админы эрхээр устгах эрхтэй.
2.2.4 Давтан зөрчил гаргасан хэрэглэгчийн бүртгэлийг хаах эрхтэй.
2.2.5 Үйлчилгээний нөхцөл, шимтгэлийн хувь, гишүүнчлэлийн эрхийн төрөл,
үнэ,нөхцөлийг нэг талын шийдвэрээр өөрчлөх.
2.2.6 Системийн ажиллагааг сайжруулах, шинэчлэх зорилгоор үйлчилгээний зарим хэсгийг
түр зогсоох.
2.2.7 Хэрэглэгчийн бүртгэлийг дараах тохиолдолд хязгаарлах, түр хаах, бүр мөсөн устгах:
• нөхцөл зөрчсөн,
• хууль бус үйлдэл хийсэн,
• бусдын эрх ашигт хохирол учруулсан,
• худалдан авагч, борлуулагчийг залилсан шинжтэй үйлдэл гаргасан.
2.2.8 Платформын хэвийн үйл ажиллагаанд саад учруулсан, техникийн халдлага, залилан,
автомат систем ашигласан тохиолдолд хууль хяналтын байгууллагад шилжүүлэх.
2.3 Хэрэглэгчийн эрх
Хэрэглэгч дараах эрхтэй:
2.3.1 Платформын үйлчилгээг энэхүү нөхцөлийн хүрээнд ашиглах.
2.3.2 Өөрийн бүртгэлийн мэдээллийг засах, шинэчлэх.
2.3.3 Байршуулах контентоо устгах хүсэлт гаргах (админ баталгаажуулалтын хүрээнд).
2.3.4 Орлого олсон тохиолдолд платформын тогтоосон журмаар татан авах.
2.3.5 Өөрийн байршуулсан контентыг бусдад ашиглагдаж байгааг мэдсэн тохиолдолд,
тухайн контентын дор устгах хүсэлт үлдээх эрхтэй. / Устгах хүсэлтийг платформын админ
баталсны дараа тухайн контент сайтаас устаж, бүх холбогдох борлуулалт, үзүүлэлт
зогсоно./
2.4 Хэрэглэгчийн үүрэг
Хэрэглэгч дараах үүргийг хүлээнэ:
2.4.1 Платформд бүртгүүлэхдээ үнэн зөв мэдээлэл өгөх.
2.4.2 Өөрийн бүртгэлийн нэвтрэх мэдээллийн нууцлалыг хадгалах, гуравдагч этгээдэд
дамжуулахгүй байх.
2.4.3 Байршуулах бүх контент нь:
• өөрийн бүтээл байх, эсхүл
• хууль ёсны ашиглах, худалдах эрхтэй байх.
2.4.4 Дараах төрлийн контентыг байршуулахгүй байх:
• зохиогчийн эрх зөрчсөн,
• хуурамч диплом, гэрчилгээ, албан баримт,
• хууль бус үйл ажиллагаанд ашиглагдах материал,
• бусдыг төөрөгдүүлсэн, худал мэдээлэл.
2.4.5 Платформын системд зориудаар ачаалал өгөх, автомат таталт, халдлага хийхийг
хориглоно.
2.4.6 Худалдан авсан контентыг зөвхөн хувийн болон хуульд нийцсэн зорилгоор ашиглах,
дахин худалдах, олон нийтэд тараахыг хориглоно (хэрэв борлуулагч тусгай зөвшөөрөл
олгоогүй бол).
2.4.7 Хууль, гуравдагч этгээдийн эрхийг зөрчсөнөөс үүсэх бүх хариуцлагыг өөрөө бүрэн
хүлээнэ.

3. ТӨЛБӨР, ШИМТГЭЛ
3.1 Борлуулалт, төлбөр
3.1.1 Хэрэглэгчийн байршуулсан контент борлуулалт хийгдсэн тохиолдолд, платформын
тодорхойлсон комисс / шимтгэл авна.
3.1.2 Борлуулалтын төлбөрийг автомат системээр гүйлгээ хийн шилжүүлнэ.
3.1.3 Хэрэглэгч нь зөвхөн хууль ёсны, эрхтэй контент байршуулсан тохиолдолд төлбөр
авах эрхтэй.
3.2 Гишүүнчлэлийн эрх болон Онцлох бүтээгдэхүүн үйлчилгээний төлбөр
3.2.1 Гишүүнчлэлийн эрхийн төрөл, үнэ, хугацаа, нэмэлт эрхийг платформын сайт болон
аппликэйшнд тодорхой зааж өгнө.
3.2.2 Онцлох бүтээгдэхүүний байршуулалт:
• Үнийн тооцоо нь өдрөөр, платформын заасан тарифын дагуу
• Онцлох бүтээгдэхүүн цэсэнд байршуулсан контент нь хэрэглэгчийн нийт
борлуулалт, шимтгэлд нэмэлт нөлөөлөхгүй
3.2.3 Гишүүнчлэлийн эрх болон Онцлох бүтээгдэхүүн үйлчилгээний төлбөрийг
платформын зөвшөөрсөн бүх аргаар төлж болно(карт, qpay, банк шилжүүлэг гэх мэт).

4. Контентын өмчлөл
4.1 Контентыг байршуулснаар олгогдох эрх
4.1.1 Контентыг байршуулснаар Хэрэглэгч Платформд тухайн контентийг худалдан
борлуулах, хэрэглэгчдэд үзүүлэх эрхийг олгож байна. Энэхүү эрх нь зөвхөн тус
платформын хүрээнд үйлчлэх ба хэрэглэгчийн өөрийн өмчлөлд нөлөөлөхгүй.
4.1.2 Хэрэглэгч нь байршуулсан контентын хууль ёсны эрх, лицензийг эзэмшиж байгаа
эсэхэд бүрэн хариуцна.
4.2 Гуравдагч этгээдээс ирсэн эрхийн зөрчилтэй холбоотой мэдэгдэл
4.2.1 Хэрэв гуравдагч этгээд Хэрэглэгчийн байршуулсан контент нь гуравдагч этгээдийн
зохиогчийн эрхийг зөрчсөн гэж үзэж, copyright / зохиогчийн эрхийн гомдол гаргасан
тохиолдолд:
• 4.2.1.1 Платформ нь тухайн гомдлыг хүлээн авч шалган, үндэслэлтэй гэж үзвэл
админы эрхээр устгах эрхтэй.
• 4.2.1.2 Платформ нь тухайн гомдлын шалтгааныг судалж, боломжтой тохиолдолд
Хэрэглэгчид мэдээлэл өгөх.
• 4.2.1.3 Платформ нь зөвхөн зуучлагч тул тухайн контентын хууль ёсны өмчлөлийн
талаар шууд хариуцлага хүлээхгүй.

5. МАРГААН ШИЙДВЭРЛЭХ
5.1 Харилцан зөвшилцөх: Талууд аливаа маргаан гарсан тохиолдолд эхлээд харилцан
зөвшилцөх замаар шийдвэрлэхийг эрмэлзэнэ.
5.2 Шүүхэд хандах: Харилцан зөвшилцөөгөөр шийдвэрлэж чадахгүй бол талууд Монгол
Улсын хүчин төгөлдөр хуулийн дагуу шүүхэд хандах эрхтэй.`

export default function TermsAndConditionsModal({ 
  isOpen, 
  onClose, 
  onAccept,
  showAcceptButton = false 
}: TermsAndConditionsModalProps) {
  const { language } = useLanguage()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTermsAccepted(false)
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleAccept = async () => {
    if (!termsAccepted) {
      setError(language === 'mn' 
        ? 'Та үйлчилгээний нөхцөлийг зөвшөөрөх ёстой' 
        : 'You must accept the terms and conditions')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/auth/accept-terms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept terms and conditions')
      }

      const data = await response.json()
      
      // Update user in localStorage
      if (data.user) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...currentUser, termsAccepted: true }))
      }

      if (onAccept) {
        onAccept()
      }
    } catch (err: any) {
      console.error('Error accepting terms and conditions:', err)
      setError(err.message || (language === 'mn' 
        ? 'Алдаа гарлаа. Дахин оролдоно уу.' 
        : 'An error occurred. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 min-h-screen"
      onClick={showAcceptButton ? undefined : onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full p-8 transform transition-all relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Only show if showAcceptButton is false */}
        {onClose && !showAcceptButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Modal Content */}
        <div>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[#004e6c] dark:text-gray-200 mb-2">
              {language === 'mn' ? 'Үйлчилгээний нөхцөл' : 'Terms and Conditions'}
            </h2>
          </div>

          {/* Terms Content */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg max-h-[60vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
              {TERMS_CONTENT}
            </pre>
          </div>

          {/* Accept Checkbox and Button (only shown if showAcceptButton is true) */}
          {showAcceptButton && (
            <>
              {/* Terms Checkbox */}
              <div className="mb-6 flex items-start space-x-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <input
                  type="checkbox"
                  id="terms-accept"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    setError(null)
                  }}
                  className="mt-1 w-5 h-5 text-[#004e6c] border-gray-300 rounded focus:ring-[#004e6c] focus:ring-2 cursor-pointer"
                />
                <label
                  htmlFor="terms-accept"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1 text-left"
                >
                  {language === 'mn' 
                    ? 'Би үйлчилгээний нөхцөлийг уншиж, зөвшөөрч байна' 
                    : 'I have read and agree to the Terms and Conditions'}
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Accept Button */}
              <button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-[#004e6c] hover:bg-[#003d56] dark:bg-[#006b8f] dark:hover:bg-[#005a7a] text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting 
                  ? (language === 'mn' ? 'Хадгалж байна...' : 'Saving...')
                  : (language === 'mn' ? 'Зөвшөөрөх' : 'Accept')
                }
              </button>
            </>
          )}

          {/* Close Button (only shown if not showing accept button) */}
          {!showAcceptButton && onClose && (
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-[#004e6c] hover:bg-[#003d56] dark:bg-[#006b8f] dark:hover:bg-[#005a7a] text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold"
            >
              {language === 'mn' ? 'Хаах' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

