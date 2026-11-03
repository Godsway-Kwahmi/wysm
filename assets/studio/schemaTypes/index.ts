import {seo} from './objects/seo'
import {mediaItem} from './objects/mediaItem'
import {supporter} from './objects/supporter'
import {strand} from './objects/strand'

import {publication} from './documents/publication'
import {intervention} from './documents/intervention'
import {page} from './documents/page'
import {siteSettings} from './documents/siteSettings'
import {homePage} from './documents/homePage'
import {aboutPage} from './documents/aboutPage'
import {publicationsPage} from './documents/publicationsPage'
import {creativeWorksPage} from './documents/creativeWorksPage'
import {programsPage} from './documents/programsPage'
import {contactPage} from './documents/contactPage'

export const schemaTypes = [
  // Objects
  seo,
  mediaItem,
  supporter,
  strand,

  // Documents
  publication,
  intervention,
  page,
  siteSettings,
  homePage,
  aboutPage,
  publicationsPage,
  creativeWorksPage,
  programsPage,
  contactPage,
]
