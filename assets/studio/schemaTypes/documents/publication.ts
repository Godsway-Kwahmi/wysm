import {defineType, defineField} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const publication = defineType({
  name: 'publication',
  title: 'Publication',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      description: 'For example: Journal article, Novel, Short story, Encyclopedia entry, Policy brief, Report.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published date',
      type: 'date',
      description: 'Sets the display year and ordering (newest first).',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publisher',
      title: 'Publisher',
      type: 'string',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
      description: 'Short 2-4 sentence description shown on the publications list and search.',
    }),
    defineField({
      name: 'abstract',
      title: 'Full abstract',
      type: 'text',
      rows: 8,
      description: 'Shown on the publication\'s dedicated page. Leave a blank line between paragraphs.',
    }),
    defineField({
      name: 'citation',
      title: 'Citation',
      type: 'string',
      description: 'How to cite this work.',
    }),
    defineField({
      name: 'doi',
      title: 'DOI URL',
      type: 'url',
      description: 'e.g. https://doi.org/10.1093/...',
    }),
    defineField({
      name: 'downloadUrl',
      title: 'Download path',
      type: 'string',
      description: 'Path to downloadable PDF (e.g. assets/pdf/publications/name.pdf).',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External link',
      type: 'url',
      description: 'Where to read or buy at the publisher if no download PDF is available.',
    }),
    defineField({
      name: 'image',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
    }),
    defineField({
      name: 'url',
      title: 'Page link',
      type: 'string',
      description: 'HTML page filename or URL (e.g. publication-when-you-see-me.html).',
    }),
  ],
  orderings: [
    {title: 'Newest first', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', subtitle: 'kind', media: 'image'},
  },
})
