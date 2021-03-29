import React, { useState } from 'react'
import defaults from '../common/defaults'
import { Flex, Accordion, AccordionButton, AccordionItem, AccordionPanel,
	Box, Container, Heading, Fade } from '@chakra-ui/react'

export const ActionPanel = (props) => {

	const [isOpen, setIsOpen] = useState(-1)

	return (
		<Flex w='60ch'
			bg='accent'
			color='black'
			pos='fixed'
			bottom='0'
			maxWidth={defaults.layout.width}
			mb='99px'
			borderRadius='30px'
			left='50%'
			transform='translateX(-50%)'
			alignItems='center'
			{...props}>
			<Accordion layerStyle='actionPanel' alignItems='middle' allowToggle onChange={(n) => setIsOpen(n)}>
				<AccordionItem border='none'>
					{({ isExpanded }) => (
						<>
							{isExpanded &&
								<>
									<AccordionButton
										display='block'
										m='0 auto'
										justifyContent='center'>
										<Heading as='span' size='sm'>Close</Heading>
									</AccordionButton>
								</>
							}
							<AccordionPanel pb={4}>
								<Box maxW={defaults.layout.width} m='0 auto'>
									<Container minH='600px' />
								</Box>
							</AccordionPanel>
							{!isExpanded && isOpen === -1 &&
								<Fade in={true} height='100%'>
									<AccordionButton height='100%' p='30px 111px'>
										<Heading as='span' size='md' ml='5px'>Burn</Heading>
									</AccordionButton>
								</Fade>
							}
						</>
					)}
				</AccordionItem>

				<AccordionItem border='none'>
					{({ isExpanded }) => (
						<>
							{isExpanded &&
									<AccordionButton
										display='block'
										m='0 auto'
										justifyContent='center'>
										<Heading as='span' size='sm'>Close</Heading>
									</AccordionButton>
							}
							<AccordionPanel pb={4}>
								<Box maxW={defaults.layout.width} m='0 auto'>
									<Container minH='600px' />
								</Box>
							</AccordionPanel>
							{!isExpanded && isOpen === -1 &&
								<Fade in={true} height='100%'>
									<AccordionButton height='100%' p='30px 111px'>
										<Heading as='span' size='md' ml='5px'>Claim</Heading>
									</AccordionButton>
								</Fade>
							}
						</>
					)}
				</AccordionItem>
			</Accordion>
		</Flex>
	)
}