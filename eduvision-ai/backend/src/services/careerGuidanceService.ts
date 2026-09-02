import db, { memoryStore } from '../db/connection'

export interface StreamRecommendation {
  recommendedGroup: string
  tamilGroupName: string
  subjectsIncluded: string[]
  matchPercentage: number
  rationale: string
  tamilRationale: string
  suitableCareers: string[]
  recommendedEntranceExams: string[]
}

export interface CareerPathway {
  id: string
  title: string
  tamilTitle: string
  category: 'Engineering' | 'Medical & Healthcare' | 'Pure Sciences & Research' | 'Commerce & Finance' | 'Civil Services & Law'
  higherSecondaryGroup: string
  entranceExam: string
  topTamilNaduInstitutions: string[]
  typicalDuration: string
  keyMilestones: string[]
  scholarshipOpportunities: string[]
}

export interface ScholarshipScheme {
  id: string
  schemeName: string
  tamilSchemeName: string
  offeredBy: string
  benefitDetails: string
  eligibilityCriteria: string[]
  howToApply: string
  portalUrl: string
}

export function recommendHigherSecondaryStream(params: {
  mathScore?: number
  scienceScore?: number
  socialScore?: number
  careerInterest?: string
}): StreamRecommendation[] {
  const math = params.mathScore !== undefined ? params.mathScore : 85
  const sci = params.scienceScore !== undefined ? params.scienceScore : 88
  const soc = params.socialScore !== undefined ? params.socialScore : 80
  const interest = (params.careerInterest || '').toLowerCase()

  const recommendations: StreamRecommendation[] = []

  // Group 1: Bio-Maths
  let bioMathMatch = Math.round((math * 0.45) + (sci * 0.55))
  if (interest.includes('doctor') || interest.includes('medicine') || interest.includes('bio') || interest.includes('neet')) {
    bioMathMatch = Math.min(98, bioMathMatch + 10)
  }
  recommendations.push({
    recommendedGroup: 'Group 1: Physics, Chemistry, Biology & Mathematics (Bio-Maths)',
    tamilGroupName: 'பிரிவு 1: இயற்பியல், வேதியியல், உயிரியல் & கணிதம் (உயிர்-கணிதம்)',
    subjectsIncluded: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Tamil', 'English'],
    matchPercentage: bioMathMatch,
    rationale: 'Maximum career versatility. Opens eligibility for both Medical (NEET) and Engineering (TNEA/JEE), as well as Biotechnology and Pure Science degrees.',
    tamilRationale: 'மருத்துவம் (NEET) மற்றும் பொறியியல் (TNEA/JEE) ஆகிய இரு துறைகளுக்கும் தகுதி பெறும் சிறந்த பிரிவு.',
    suitableCareers: ['Doctor (MBBS/BDS)', 'Biomedical Engineer', 'Pharmacist', 'Geneticist', 'Data Scientist'],
    recommendedEntranceExams: ['NEET-UG', 'JEE Main', 'TNEA', 'ICAR AIEEA'],
  })

  // Group 2: CS-Maths
  let csMathMatch = Math.round((math * 0.6) + (sci * 0.4))
  if (interest.includes('software') || interest.includes('computer') || interest.includes('ai') || interest.includes('engineering')) {
    csMathMatch = Math.min(99, csMathMatch + 12)
  }
  recommendations.push({
    recommendedGroup: 'Group 2: Physics, Chemistry, Computer Science & Mathematics (CS-Maths)',
    tamilGroupName: 'பிரிவு 2: இயற்பியல், வேதியியல், கணினி அறிவியல் & கணிதம் (கணினி-கணிதம்)',
    subjectsIncluded: ['Physics', 'Chemistry', 'Computer Science', 'Mathematics', 'Tamil', 'English'],
    matchPercentage: csMathMatch,
    rationale: 'Ideal for technology, software development, artificial intelligence, robotics, and engineering careers.',
    tamilRationale: 'மென்பொருள் பொறியியல், செயற்கை நுண்ணறிவு மற்றும் தொழில்நுட்பத் துறைகளுக்கு ஏற்ற பிரிவு.',
    suitableCareers: ['Software Engineer', 'AI Specialist', 'Cybersecurity Analyst', 'Aerospace Engineer', 'Robotics Architect'],
    recommendedEntranceExams: ['JEE Main', 'JEE Advanced', 'TNEA', 'BITSAT'],
  })

  // Group 3: Pure Science
  const pureSciMatch = Math.round(sci * 0.9)
  recommendations.push({
    recommendedGroup: 'Group 3: Physics, Chemistry, Botany & Zoology (Pure Science)',
    tamilGroupName: 'பிரிவு 3: இயற்பியல், வேதியியல், தாவரவியல் & விலங்கியல் (தூய அறிவியல்)',
    subjectsIncluded: ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Tamil', 'English'],
    matchPercentage: pureSciMatch,
    rationale: 'Focused preparation for Medical, Dental, Veterinary, Agriculture, and biological research careers without higher mathematics.',
    tamilRationale: 'கணிதம் இல்லாமல் மருத்துவம், கால்நடை மருத்துவம் மற்றும் வேளாண்மை படிப்புகளுக்கு உகந்தது.',
    suitableCareers: ['Doctor (MBBS)', 'Veterinarian (BVSc)', 'Agricultural Scientist (BSc Agri)', 'Microbiologist'],
    recommendedEntranceExams: ['NEET-UG', 'TANUVAS', 'TNAU Admissions'],
  })

  // Group 4: Commerce & Accountancy
  let commMatch = Math.round((soc * 0.6) + (math * 0.4))
  if (interest.includes('finance') || interest.includes('business') || interest.includes('ca') || interest.includes('bank')) {
    commMatch = Math.min(96, commMatch + 15)
  }
  recommendations.push({
    recommendedGroup: 'Group 4: Commerce, Accountancy, Economics & Business Mathematics',
    tamilGroupName: 'பிரிவு 4: வணிகவியல், கணக்குப்பதிவியல், பொருளியல் & வணிகக் கணிதம்',
    subjectsIncluded: ['Commerce', 'Accountancy', 'Economics', 'Business Maths', 'Tamil', 'English'],
    matchPercentage: commMatch,
    rationale: 'Superb pathway for Chartered Accountancy (CA), Corporate Finance, Banking, Company Secretary (CS), and Business Administration.',
    tamilRationale: 'சார்ட்டர்ட் அக்கவுண்டன்ட் (CA), வங்கிப் பணிகள் மற்றும் வணிக மேலாண்மைக்கு ஏற்ற பிரிவு.',
    suitableCareers: ['Chartered Accountant (CA)', 'Investment Banker', 'Corporate Lawyer', 'Financial Analyst', 'Entrepreneur'],
    recommendedEntranceExams: ['CA Foundation', 'CMA Foundation', 'CS EET', 'CUET UG'],
  })

  // Sort descending by match percentage
  return recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage)
}

export function listCareerPathways(): CareerPathway[] {
  return [
    {
      id: 'path-med',
      title: 'Medical & Healthcare (MBBS / BDS / AYUSH)',
      tamilTitle: 'மருத்துவம் மற்றும் சுகாதார அறிவியல்',
      category: 'Medical & Healthcare',
      higherSecondaryGroup: 'Group 1 (Bio-Maths) or Group 3 (Pure Science)',
      entranceExam: 'NEET-UG (National Eligibility cum Entrance Test)',
      topTamilNaduInstitutions: [
        'Madras Medical College (MMC), Chennai',
        'Stanley Medical College, Chennai',
        'Coimbatore Medical College',
        'Madurai Medical College',
        'Christian Medical College (CMC), Vellore',
      ],
      typicalDuration: '5.5 Years (4.5 Years Academic + 1 Year Internship)',
      keyMilestones: [
        'Class 11: Master NCERT & Samacheer Kalvi Biology, Physics & Chemistry fundamentals',
        'Class 12: Complete 50+ timed full-length NEET mock tests',
        'May (After Class 12): Appear for NEET-UG',
        'June-July: Participate in Tamil Nadu State Medical Counseling (DME)',
      ],
      scholarshipOpportunities: [
        'Tamil Nadu 7.5% Government School Student Quota (100% Free Tuition & Hostel)',
        'Post-Matric Scholarship for SC/ST/OBC',
      ],
    },
    {
      id: 'path-eng',
      title: 'Engineering & Technology (B.E. / B.Tech)',
      tamilTitle: 'பொறியியல் மற்றும் தொழில்நுட்பம்',
      category: 'Engineering',
      higherSecondaryGroup: 'Group 1 (Bio-Maths) or Group 2 (CS-Maths)',
      entranceExam: 'TNEA (Class 12 Marks Cutoff) & JEE Main/Advanced',
      topTamilNaduInstitutions: [
        'IIT Madras (Rank #1 in India)',
        'College of Engineering Guindy (CEG), Anna University',
        'MIT Campus, Chromepet',
        'PSG College of Technology, Coimbatore',
        'NIT Tiruchirappalli',
      ],
      typicalDuration: '4 Years (8 Semesters)',
      keyMilestones: [
        'Class 11 & 12: Maintain 95%+ cutoff in Maths, Physics, and Chemistry',
        'January & April: Appear for JEE Main',
        'June: Apply for TNEA Single Window Counseling based on Class 12 PCM Cutoff',
      ],
      scholarshipOpportunities: [
        '7.5% Government School Engineering Quota (Full Fee Waiver by TN Govt)',
        'AICTE Pragati Scholarship for Girls',
      ],
    },
    {
      id: 'path-ca',
      title: 'Chartered Accountancy & Finance (CA / CMA / CS)',
      tamilTitle: 'சார்ட்டர்ட் அக்கவுண்டன்சி & நிதித் துறை',
      category: 'Commerce & Finance',
      higherSecondaryGroup: 'Group 4 (Commerce & Accountancy)',
      entranceExam: 'CA Foundation (ICAI)',
      topTamilNaduInstitutions: [
        'Loyola College, Chennai',
        'Madras Christian College (MCC), Chennai',
        'PSG College of Arts & Science, Coimbatore',
        'ICAI Southern Regional Council, Chennai',
      ],
      typicalDuration: '4 to 5 Years',
      keyMilestones: [
        'Class 12: Register for ICAI CA Foundation during board preparation',
        'May / June: Appear for CA Foundation Examination',
        'Year 2: CA Intermediate Examination & 2 Years Articleship',
        'Year 4: CA Final Examination & Certification',
      ],
      scholarshipOpportunities: [
        'ICAI Merit-cum-Means Financial Assistance Scheme',
        'Tamil Nadu Higher Education Scholarship',
      ],
    },
    {
      id: 'path-civil',
      title: 'Civil Services & State Administration (UPSC & TNPSC)',
      tamilTitle: 'குடிமைப் பணிகள் மற்றும் அரசு நிர்வாகம் (UPSC / TNPSC)',
      category: 'Civil Services & Law',
      higherSecondaryGroup: 'Any Higher Secondary Stream (Group 1, 2, 3, or 4)',
      entranceExam: 'TNPSC Group I/II & UPSC Civil Services Examination',
      topTamilNaduInstitutions: [
        'All India Civil Services Coaching Centre (AICSCC), Chennai',
        'University of Madras',
        'Presidency College, Chennai',
      ],
      typicalDuration: '3 Years Degree + 1 to 2 Years Dedicated Preparation',
      keyMilestones: [
        'Class 11 & 12: Build strong reading habit with Daily Dinamani & The Hindu',
        'Undergraduate: Complete any recognized Bachelor Degree with high distinction',
        'Age 21+: Appear for TNPSC Group 1 / UPSC Prelims & Mains',
      ],
      scholarshipOpportunities: [
        'Naan Mudhalvan All India Civil Services Scheme (Rs. 7,500/month stipend)',
        'Tamil Nadu Backward Classes Welfare Scholarship',
      ],
    },
  ]
}

export function listScholarships(): ScholarshipScheme[] {
  return [
    {
      id: 'sch-pudhumai',
      schemeName: 'Pudhumai Penn Scheme (Moovalur Ramamirtham Ammaiyar)',
      tamilSchemeName: 'புதுமைப் பெண் திட்டம்',
      offeredBy: 'Government of Tamil Nadu (Social Welfare Department)',
      benefitDetails: '₹1,000 per month direct bank transfer until completion of Undergraduate degree / Diploma.',
      eligibilityCriteria: [
        'Female students who studied in Tamil Nadu Government Schools from Class 6 to Class 12.',
        'Enrolled in recognized Higher Education institutions (Arts, Science, Engineering, Medicine, Poly).',
      ],
      howToApply: 'Apply through your college nodal officer on the Penkalvi Tamil Nadu portal.',
      portalUrl: 'https://penkalvi.tn.gov.in',
    },
    {
      id: 'sch-7point5',
      schemeName: 'Tamil Nadu 7.5% Preferential Government School Quota',
      tamilSchemeName: '7.5% அரசுப் பள்ளி மாணவர்களுக்கான முன்னுரிமை இடஒதுக்கீடு',
      offeredBy: 'Government of Tamil Nadu',
      benefitDetails: '7.5% horizontal reservation in Professional Courses (MBBS, BDS, B.E., B.Tech, Agri, Law) + 100% Tuition, Hostel & Examination fee paid by TN Government.',
      eligibilityCriteria: [
        'Studied continuously in Tamil Nadu Government Schools from Class 6 to Class 12.',
        'Qualified in relevant entrance exam (e.g. NEET for Medical, TNEA Cutoff for Engineering).',
      ],
      howToApply: 'Auto-verified during TNEA and DME Tamil Nadu counseling using EMIS school records.',
      portalUrl: 'https://tneaonline.org',
    },
    {
      id: 'sch-nmms',
      schemeName: 'National Means-cum-Merit Scholarship (NMMS)',
      tamilSchemeName: 'தேசிய வருவாய் வழி மற்றும் திறன் படிப்புதவித் தொகை',
      offeredBy: 'Ministry of Education, Government of India',
      benefitDetails: '₹12,000 per year (₹1,000/month) from Class 9 to Class 12.',
      eligibilityCriteria: [
        'Studying in Government / Government-aided schools with parental income below ₹3.5 Lakhs/year.',
        'Passed NMMS State Level Selection Test in Class 8.',
      ],
      howToApply: 'Register on the National Scholarship Portal (NSP).',
      portalUrl: 'https://scholarships.gov.in',
    },
  ]
}

export function evaluateQuotaEligibility(params: {
  schoolType: 'government' | 'aided' | 'private'
  studiedFromClass6To12InGovt: boolean
  gender: 'male' | 'female' | 'other'
}): {
  is7Point5QuotaEligible: boolean
  isPudhumaiPennEligible: boolean
  applicableSchemes: string[]
} {
  const isGovt = params.schoolType === 'government' && params.studiedFromClass6To12InGovt
  const isFemale = params.gender === 'female'

  const schemes: string[] = []
  if (isGovt) {
    schemes.push('Tamil Nadu 7.5% Government School Preferential Quota (Free Tuition & Hostel)')
  }
  if (isGovt && isFemale) {
    schemes.push('Pudhumai Penn Scheme (₹1,000 / month financial assistance)')
  }
  schemes.push('National Means-cum-Merit Scholarship (NMMS)')
  schemes.push('Chief Minister Special Higher Education Scholarship')

  return {
    is7Point5QuotaEligible: isGovt,
    isPudhumaiPennEligible: isGovt && isFemale,
    applicableSchemes: schemes,
  }
}
