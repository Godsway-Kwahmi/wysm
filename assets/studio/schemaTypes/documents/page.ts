import {defineType, defineField} from 'sanity'
import {DocumentIcon} from '@sanity/icons'

export const page = defineType({
  name: 'page',
  title: 'Custom page',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'The heading shown at the top of the page.',
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'The address path for this page (e.g. "press-release" renders as page.html?slug=press-release).',
    }),
    defineField({
      name: 'summary',
      title: 'Summary / Standfirst',
      type: 'text',
      rows: 3,
      description: 'The opening lede paragraph set beneath the page title.',
    }),
    defineField({
      name: 'image',
      title: 'Featured Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'Required description for accessibility.',
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Page Content',
      type: 'text',
      rows: 14,
      description: 'Main body copy. Separate paragraphs with a blank line.',
    }),
    defineField({
      name: 'seo',
      title: 'Search & Social',
      type: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
      media: 'image',
    },
    prepare({title, subtitle, media}) {
      return {
        title: title || 'Untitled Page',
        subtitle: subtitle ? `/${subtitle}` : 'No slug',
        media,
      }
    },
  },
})
