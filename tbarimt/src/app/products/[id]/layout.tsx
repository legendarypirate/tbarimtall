import { Metadata } from 'next'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!res.ok) {
      return null
    }
    
    const data = await res.json()
    return data.product || null
  } catch (error) {
    console.error('Error fetching product for metadata:', error)
    return null
  }
}

function getAbsoluteUrl(url: string, baseUrl: string = 'https://tbarimt.mn') {
  if (!url) return `${baseUrl}/tbarimt.jpeg`
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // Handle Cloudinary URLs or API URLs
  if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
    return url.startsWith('//') ? `https:${url}` : url
  }
  // Handle API URLs
  if (url.includes('/api/') || url.includes('/uploads/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tbarimt.mn'
    return url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/${url}`
  }
  const origin = baseUrl || 'https://tbarimt.mn'
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id)
  
  if (!product) {
    return {
      title: 'Бүтээгдэхүүн - Tbarimt.mn',
      description: 'Контент Дэлгүүр - Бүх төрлийн контент нэг дороос',
    }
  }

  const title = `${product.title} - Tbarimt.mn`
  const description = product.description 
    ? product.description.substring(0, 300).replace(/<[^>]*>/g, '').trim()
    : `${product.title} - ${product.price || 0}₮ - Tbarimt.mn`
  
  // Get absolute image URL - ensure it's publicly accessible
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tbarimt.mn'
  let imageUrl = getAbsoluteUrl(product.image || '/tbarimt.jpeg', siteUrl)
  
  // Ensure image URL is HTTPS and absolute
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
  }
  
  // Use UUID if available, otherwise use ID
  const productIdentifier = product.uuid || params.id
  const pageUrl = `${siteUrl}/products/${productIdentifier}`

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Tbarimt.mn',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
          type: 'image/jpeg',
        },
      ],
      locale: 'mn_MN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@tbarimt',
    },
    // Additional meta tags for better Facebook sharing
    other: {
      'og:image:secure_url': imageUrl.startsWith('https') ? imageUrl : imageUrl.replace('http://', 'https://'),
      'og:image:alt': product.title,
    },
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

