import {defineType, defineField} from 'sanity'
import {HomeIcon} from '@sanity/icons'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'welcome',
      title: 'Welcome statement',
      type: 'text',
      rows: 4,
      description: 'The mission statement below the hero image.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
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
