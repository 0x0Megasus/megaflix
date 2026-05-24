import SEO from '../components/SEO'

export default function DMCA() {
  return (
    <section className="legal-page">
      <SEO title="DMCA Takedown" description="DMCA takedown request requirements and copyright infringement reporting for MegaFlix." path="/dmca" />
      <div className="legal-page__inner">
        <h1 className="legal-page__title">DMCA Takedown Request Requirements</h1>

        <p className="legal-page__text">
          Our streaming website provides links to content hosted by third-party sites.
          We do not host any of the movies or other content ourselves, and we do not
          have control over the content hosted on these third-party sites. We simply
          provide links to these sites as a service to our users.
        </p>

        <p className="legal-page__text">
          We take the intellectual property rights of others seriously and require that
          our users do the same. The Digital Millennium Copyright Act (DMCA) established
          a process for addressing claims of copyright infringement. If you own a copyright
          or have authority to act on behalf of a copyright owner and want to report a claim
          that a third party is infringing that material please submit a DMCA report via email
          and we will take appropriate action.
        </p>

        <h2 className="legal-page__subtitle">DMCA Report Requirements</h2>

        <ul className="legal-page__list">
          <li>
            A description of the copyrighted work that you claim is being infringed.
          </li>
          <li>
            A description of the material you claim is infringing and that you want
            removed or access to which you want disabled with a URL and proof you are
            the original owner or other location of that material.
          </li>
          <li>
            Your name, title (if acting as an agent), address, telephone number, and
            email address.
          </li>
          <li>
            The following statement: &ldquo;I have a good faith belief that the use of the
            copyrighted material I am complaining of is not authorized by the copyright owner,
            its agent, or the law (e.g., as a fair use).&rdquo;
          </li>
          <li>
            The following statement: &ldquo;The information in this notice is accurate and,
            under penalty of perjury, I am the owner, or authorized to act on behalf of the
            owner, of the copyright or of an exclusive right that is allegedly infringed.&rdquo;
          </li>
          <li>
            The following statement: &ldquo;I understand that I am subject to legal action upon
            submitting a DMCA request without solid proof.&rdquo;
          </li>
          <li>
            An electronic or physical signature of the owner of the copyright or a person
            authorized to act on the owner&rsquo;s behalf.
          </li>
        </ul>

        <p className="legal-page__text">
          Please send your DMCA takedown notice to us. We will promptly investigate and
          take appropriate action in accordance with the DMCA.
        </p>

        <p className="legal-page__text">
          Thank you for your cooperation.
        </p>
      </div>
    </section>
  )
}
