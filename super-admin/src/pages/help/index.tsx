import {
  Grid,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

const faqs = [
  {
    question: 'How do I manage users?',
    answer:
      'Navigate to the "Users" page from the sidebar to view, edit, or deactivate user accounts.',
  },
  {
    question: 'Where can I see transaction history?',
    answer:
      'The "Transactions" page provides a comprehensive list of all transactions on the platform.',
  },
  {
    question: 'How do I update my profile?',
    answer:
      'Go to "View Profile" from the top-right dropdown menu to view your details. Currently, profile editing is limited to specific fields.',
  },
];

const Help = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h3" mb={3}>
          Help Center
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" mb={3}>
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary
                expandIcon={<IconifyIcon icon="mdi:chevron-down" />}
              >
                <Typography fontWeight={600}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" mb={2}>
            Contact Support
          </Typography>
          <Typography variant="body1">
            For further assistance, please contact the development team at{' '}
            <strong>support@vtfree.com</strong>.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Help;
