import {defineType, defineField} from 'sanity'
import {CalendarIcon} from '@sanity/icons'

export const programsPage = defineType({
  name: 'programsPage',
  title: 'Programs page',
  type: 'document',
  icon: CalendarIcon,
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
      name: 'seo',
      title: 'Search & Social',
      type: 'seo',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
