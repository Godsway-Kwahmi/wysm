import {defineType, defineField, defineArrayMember} from 'sanity'
import {InfoOutlineIcon} from '@sanity/icons'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  icon: InfoOutlineIcon,
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
      rows: 3,
      description: 'Summary line under the About title.',
    }),
    defineField({
      name: 'mediaCoverage',
      title: 'Media coverage links',
      type: 'array',
      of: [defineArrayMember({type: 'mediaItem'})],
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
