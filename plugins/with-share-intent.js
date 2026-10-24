const { withMainActivity } = require('@expo/config-plugins');

const marker = 'private fun toRemindlyShareLink';

function withShareIntent(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes(marker)) return config;

    const packageLine = contents.match(/^package [^\r\n]+/m);
    if (!packageLine) throw new Error('Could not find the MainActivity Kotlin package declaration.');
    const imports = '\n\nimport android.content.Intent\nimport android.net.Uri';
    contents = contents.replace(packageLine[0], `${packageLine[0]}${imports}`);

    const onCreate = /(override fun onCreate\(savedInstanceState: Bundle\?\) \{)/;
    if (!onCreate.test(contents)) throw new Error('Could not find MainActivity.onCreate to route Android shares.');
    contents = contents.replace(onCreate, '$1\n    toRemindlyShareLink(intent)?.let { setIntent(it) }');

    const onNewIntent = /override fun onNewIntent\(intent: Intent\) \{([\s\S]*?)\n  \}/;
    if (onNewIntent.test(contents)) {
      contents = contents.replace(onNewIntent, (_match, body) => {
        const nextBody = body.includes('super.onNewIntent(intent)')
          ? body.replace('super.onNewIntent(intent)', 'val shareLink = toRemindlyShareLink(intent)\n    val nextIntent = shareLink ?: intent\n    setIntent(nextIntent)\n    super.onNewIntent(nextIntent)')
          : `${body}\n    val shareLink = toRemindlyShareLink(intent)\n    val nextIntent = shareLink ?: intent\n    setIntent(nextIntent)\n    super.onNewIntent(nextIntent)`;
        return `override fun onNewIntent(intent: Intent) {${nextBody}\n  }`;
      });
    } else {
      contents = contents.replace(/\n}\s*$/, '\n\n  override fun onNewIntent(intent: Intent) {\n    val shareLink = toRemindlyShareLink(intent)\n    val nextIntent = shareLink ?: intent\n    setIntent(nextIntent)\n    super.onNewIntent(nextIntent)\n  }\n}');
    }

    const helper = `

  private fun toRemindlyShareLink(source: Intent?): Intent? {
    if (source?.action != Intent.ACTION_SEND || source.type?.startsWith("text/") != true) return null

    val sharedText = source.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString()?.takeIf { it.isNotBlank() }
      ?: source.clipData?.takeIf { it.itemCount > 0 }?.getItemAt(0)?.coerceToText(this)?.toString()
      ?: ""
    val subject = source.getCharSequenceExtra(Intent.EXTRA_SUBJECT)?.toString().orEmpty()
    if (sharedText.isBlank() && subject.isBlank()) return null

    val uri = Uri.Builder().scheme("remindly").authority("share")
    if (sharedText.isNotBlank()) uri.appendQueryParameter("text", sharedText)
    if (subject.isNotBlank()) uri.appendQueryParameter("subject", subject)
    return Intent(Intent.ACTION_VIEW, uri.build()).setPackage(packageName)
  }
`;
    contents = contents.replace(/\n}\s*$/, `${helper}\n}`);
    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withShareIntent;
