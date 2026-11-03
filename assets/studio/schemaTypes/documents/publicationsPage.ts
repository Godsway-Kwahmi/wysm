import {defineType, defineField} from 'sanity'
import {DocumentIcon} from '@sanity/icons'

export const publicationsPage = defineType({
  name: 'publicationsPage',
  title: 'Publications page',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'summary',
      title: 'Standfirst / Summary',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'listHeading',
      title: 'Heading over list',
      type: 'string',
      description: 'e.g. "Everything we have published"',
    }),
    defineField({
      name: 'featured',
      title: 'Featured publication',
      type: 'reference',
      to: [{type: 'publication'}],
      description: 'The work featured large at top of page. Leave empty to auto-feature newest.',
    }),
    defineField({
      name: 'seo',
      title: 'Search & Social',
      type: 'seo',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
