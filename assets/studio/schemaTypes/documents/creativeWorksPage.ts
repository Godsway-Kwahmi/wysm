import {defineType, defineField, defineArrayMember} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

export const creativeWorksPage = defineType({
  name: 'creativeWorksPage',
  title: 'Creative Works page',
  type: 'document',
  icon: ImagesIcon,
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
      name: 'introduction',
      title: 'Introduction',
      type: 'text',
      rows: 4,
      description: 'Paragraph in the panel beside the section image.',
    }),
    defineField({
      name: 'galleryHeading',
      title: 'Gallery / Works heading',
      type: 'string',
    }),
    defineField({
      name: 'introImage',
      title: 'Introduction image',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
    }),
    defineField({
      name: 'strands',
      title: 'Strands',
      type: 'array',
      of: [defineArrayMember({type: 'strand'})],
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
