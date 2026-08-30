# Static

A simple static website generator.

## To do

- Implement md to html function
  + takes input markdown file and returns a readable stream of characters for the content block
  + generates paragraphs
  + generates code blocks
  + generates italics and emphasis
  + generates <img> tags
  + generates links
- Implement template rendering of webpage
  + input path for which template to use (defaults to base.html)
  + template is parsed, components are fetched and necessary params are logged
  + return string of html using template.render
    + render accepts arguments for the necessary data used by the template
    + data is inserted into the html template at the correct points
    + allow parsing @foreach statements
- build.ts links together all of the parts mentioned above, including selecting 

### Steps

- Accept markdown input
- Parse frontmatter
- Convert Markdown → HTML
- Choose template
- Render template with page data
- Write HTML to static
