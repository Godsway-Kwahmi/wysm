import {defineType, defineField} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact page',
  type: 'document',
  icon: EnvelopeIcon,
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
      name: 'formPrompt',
      title: 'Form prompt',
      type: 'string',
      description: 'e.g. "Send feedback/inquiry"',
    }),
    defineField({
      name: 'formPlaceholder',
      title: 'Message box placeholder',
      type: 'string',
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
